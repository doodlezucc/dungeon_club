import { env } from '$env/dynamic/private';
import nodemailer from 'nodemailer';
import { TransporterMailService } from './transporter-service';

export class SMTPMailService extends TransporterMailService {
	private static readonly DEFAULT_SMTP_PORT = 587;

	protected async createTransporter() {
		const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = env;

		const port = SMTP_PORT ? parseInt(SMTP_PORT) : SMTPMailService.DEFAULT_SMTP_PORT;

		return nodemailer.createTransport({
			host: SMTP_HOST,
			port: port,
			secure: SMTP_SECURE === 'true',
			auth: {
				user: SMTP_USER,
				pass: SMTP_PASS
			}
		});
	}
}
