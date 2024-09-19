import { readFile } from 'fs/promises';
import { convertTemplateToHtml, type MailTemplate } from './mail/conversion';

export interface SendMailOptions {
	subject: string;
	recipient: string;
	htmlBody: string;
}

export interface SendTemplateMailOptions<P> {
	recipient: string;
	template: MailTemplate<P>;
	params: P;
}

export abstract class MailService {
	private static bufferedLogoImage: Buffer | undefined = undefined;

	static async loadLogoImage(): Promise<Buffer> {
		if (this.bufferedLogoImage) {
			return this.bufferedLogoImage;
		}

		const loadedBytes = await readFile('./static/icon32.png');
		return (this.bufferedLogoImage = loadedBytes);
	}

	abstract sendMail(options: SendMailOptions): Promise<void>;

	async sendTemplateMail<P>(options: SendTemplateMailOptions<P>): Promise<void> {
		const { recipient, template, params } = options;
		const { subject } = template;

		const mjmlPreprocessed = await convertTemplateToHtml(template, params);

		await this.sendMail({
			subject,
			recipient,
			htmlBody: mjmlPreprocessed
		});
	}
}
