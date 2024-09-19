import { env } from '$env/dynamic/private';
import nodemailer, { type Transporter } from 'nodemailer';
import { prisma } from 'server/server';
import { TransporterMailService } from './transporter-service';

const SETTING_KEY_TOKEN_STATE = 'GMAIL_TOKEN';
interface GmailTokenState {
	accessToken: string;
	expires: number;
}

export class GmailMailService extends TransporterMailService {
	protected async createTransporter() {
		const state = await this.readState();

		return GmailMailService.createTransporterFromToken(state).on('token', (token) => {
			this.storeToken({
				accessToken: token.accessToken,
				expires: token.expires
			});
		});
	}

	private static createTransporterFromToken(tokenState: GmailTokenState): Transporter {
		const {
			GMAIL_API_USER,
			GMAIL_API_CLIENT_ID,
			GMAIL_API_CLIENT_SECRET,
			GMAIL_API_REFRESH_TOKEN
		} = env;

		return nodemailer.createTransport({
			host: 'smtp.gmail.com',
			port: 465,
			secure: true,
			auth: {
				type: 'OAuth2',
				user: GMAIL_API_USER,
				clientId: GMAIL_API_CLIENT_ID,
				clientSecret: GMAIL_API_CLIENT_SECRET,
				refreshToken: GMAIL_API_REFRESH_TOKEN,
				accessToken: tokenState.accessToken,
				expires: tokenState.expires
			}
		});
	}

	private async readState(): Promise<GmailTokenState> {
		const setting = await prisma.systemSetting.findFirstOrThrow({
			where: { key: SETTING_KEY_TOKEN_STATE }
		});

		return JSON.parse(setting.jsonValue);
	}

	private async storeToken(token: GmailTokenState) {
		const tokenJsonString = JSON.stringify(token);

		await prisma.systemSetting.update({
			where: { key: SETTING_KEY_TOKEN_STATE },
			data: {
				jsonValue: tokenJsonString
			}
		});
	}
}
