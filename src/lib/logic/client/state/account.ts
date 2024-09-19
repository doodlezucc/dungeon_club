import type { AccountSnippet } from 'shared';
import { getSocket } from '../communication/socket'; // Avoid ../communication/index.ts to prevent cyclic dependency in ../communication/rest.ts
import { WithState } from './with-state';

export class Account extends WithState<AccountSnippet> {
	static readonly instance = new Account();
	static readonly state = this.instance.state;
	static readonly campaigns = this.instance.derived(
		(account) => account.campaigns,
		(account, campaigns) => {
			return {
				...account,
				campaigns: campaigns
			};
		}
	);

	static async logIn(emailAddress: string, password: string) {
		const response = await getSocket().request('login', {
			email: emailAddress,
			password: password
		});

		this.instance.set(response);
	}

	static async attemptSignUp(emailAddress: string, password: string) {
		return await getSocket().request('accountCreate', {
			email: emailAddress,
			password: password
		});
	}

	static async attemptResetPassword(emailAddress: string, password: string) {
		return await getSocket().request('accountResetPassword', {
			email: emailAddress,
			password: password
		});
	}

	static async verifyActivationCode(endpointPath: string) {
		const response = await fetch(endpointPath);

		if (!response.ok) {
			if (response.status === 401) {
				throw 'Code is invalid.';
			} else {
				throw `Error ${response.status}: ${response.statusText}`;
			}
		}
	}
}

export const accountState = Account.state;
