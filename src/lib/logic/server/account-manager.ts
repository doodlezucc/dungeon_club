import type { Crypt } from '@prisma/client';
import { SelectAccount } from 'shared';
import { ExpiringCodeManager } from './expiring-code-manager';
import { prisma, server } from './server';
import { TEMPLATE_ACTIVATE_ACCOUNT, TEMPLATE_RESET_PASSWORD } from './services/mail/templates';
import { encryptString, hashEmail, matchAgainstCrypt } from './util/encryption';

interface AccountActivationInfo {
	newAccountEmailHash: string;
	newAccountPasswordCrypt: Crypt;
}

interface PasswordResetInfo {
	accountHash: string;
	newPasswordCrypt: Crypt;
}

export class AccountManager {
	readonly accountActivationCodes = new ExpiringCodeManager<AccountActivationInfo>();
	readonly passwordResetCodes = new ExpiringCodeManager<PasswordResetInfo>();

	private async findAccount(rawEmail: string) {
		const emailHash = hashEmail(rawEmail);

		return await prisma.account.findFirst({
			where: { emailHash: emailHash }
		});
	}

	async doesAccountExist(rawEmail: string) {
		const accountProperties = await this.findAccount(rawEmail);
		return accountProperties !== null;
	}

	async login(rawEmail: string, rawPassword: string) {
		const emailHash = hashEmail(rawEmail);

		const account = await prisma.account.findFirst({
			where: { emailHash: emailHash },
			select: { ...SelectAccount, encryptedPassword: true }
		});

		if (!account) {
			throw 'No account is registered under this email address';
		}

		const isValidPassword = await matchAgainstCrypt(rawPassword, account.encryptedPassword);

		if (!isValidPassword) {
			throw 'Password incorrect';
		}

		const tokenInfo =
			account.tokenInfo ??
			(await prisma.accessToken.create({
				data: {
					accountEmail: account.emailHash
				}
			}));

		return { ...account, tokenInfo };
	}

	async preparePasswordReset(rawEmail: string, rawPassword: string) {
		const accountProperties = await this.findAccount(rawEmail);

		if (accountProperties === null) {
			throw 'No account is registered under this email address';
		}

		const passwordCrypt = await encryptString(rawPassword);

		const code = await this.passwordResetCodes.registerNewCode(
			{
				accountHash: accountProperties.emailHash,
				newPasswordCrypt: passwordCrypt
			},
			{
				onCodeVerified: async () => {
					await prisma.account.update({
						where: { emailHash: accountProperties.emailHash },
						data: {
							encryptedPassword: {
								update: passwordCrypt
							}
						}
					});
				}
			}
		);

		await server.mailService.sendTemplateMail({
			recipient: rawEmail,
			template: TEMPLATE_RESET_PASSWORD,
			params: {
				activationCode: code,
				activationUrl: `http://localhost:5173/verify-new-password?code=${code}`
			}
		});
	}

	async prepareUnverifiedAccount(rawEmail: string, rawPassword: string) {
		const emailHash = hashEmail(rawEmail);

		const accountProperties = await prisma.account.findFirst({
			where: { emailHash: emailHash }
		});

		if (accountProperties !== null) {
			throw 'An account with this email address already exists';
		}

		const passwordCrypt = await encryptString(rawPassword);

		const code = await this.accountActivationCodes.registerNewCode(
			{
				newAccountEmailHash: emailHash,
				newAccountPasswordCrypt: passwordCrypt
			},
			{
				onCodeVerified: async () => {
					await this.storeNewAccount(emailHash, passwordCrypt);
				}
			}
		);

		await server.mailService.sendTemplateMail({
			recipient: rawEmail,
			template: TEMPLATE_ACTIVATE_ACCOUNT,
			params: {
				activationCode: code,
				activationUrl: `http://localhost:5173/activate?code=${code}`
			}
		});
	}

	private async storeNewAccount(emailHash: string, passwordCrypt: Crypt) {
		const accountProperties = await prisma.account.findFirst({
			where: { emailHash: emailHash }
		});

		if (accountProperties !== null) {
			throw 'An account with this email address already exists';
		}

		const account = await prisma.account.create({
			data: {
				emailHash: emailHash,
				encryptedPassword: {
					create: passwordCrypt
				}
			}
		});

		const accessToken = await prisma.accessToken.create({
			data: {
				accountEmail: account.emailHash
			},
			select: {
				id: true
			}
		});

		console.log('Created new account');

		return {
			accessToken: accessToken.id,
			campaigns: []
		};
	}
}
