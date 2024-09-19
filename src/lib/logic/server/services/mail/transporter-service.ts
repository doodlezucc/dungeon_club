import { MAIL_SERVICE_SENDER_EMAIL, MAIL_SERVICE_SENDER_NAME } from '$env/static/private';
import { type Transporter } from 'nodemailer';
import { MailService, type SendMailOptions } from '../mail-service';

export abstract class TransporterMailService extends MailService {
	private transporter: Transporter | null = null;

	constructor() {
		super();
		this.setupTransporter();
	}

	private async setupTransporter() {
		this.transporter = await this.createTransporter();
	}

	protected abstract createTransporter(): Promise<Transporter>;

	async sendMail(options: SendMailOptions): Promise<void> {
		const client = this.transporter;

		if (!client) {
			throw 'Transporter not initialized';
		}

		const result = await client.sendMail({
			subject: options.subject,
			from: { name: MAIL_SERVICE_SENDER_NAME, address: MAIL_SERVICE_SENDER_EMAIL },
			to: options.recipient,
			html: options.htmlBody,
			attachments: [
				{
					cid: 'logo',
					filename: 'logo.png',
					content: await MailService.loadLogoImage()
				}
			]
		});

		console.log('Result after sending mail:', result);
	}
}
