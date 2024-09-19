import { generateUniqueString } from './util/generate-string';

export interface CodeInfo<T> {
	payload: T;
	callback: () => Promise<void>;
}

interface RegisterNewCodeOptions {
	onCodeVerified: () => Promise<void>;
}

export class ExpiringCodeManager<T> {
	private readonly validCodes = new Map<string, CodeInfo<T>>();

	private async generateCode(): Promise<string> {
		return await generateUniqueString({
			length: 6,
			doesExist: async (code) => this.validCodes.has(code)
		});
	}

	async registerNewCode(
		attachedInfo: T,
		{ onCodeVerified }: RegisterNewCodeOptions
	): Promise<string> {
		const code = await this.generateCode();

		this.validCodes.set(code, {
			payload: attachedInfo,
			callback: onCodeVerified
		});
		return code;
	}

	tryResolveCode(code: string): T | null {
		const entry = this.validCodes.get(code);

		if (entry) {
			this.validCodes.delete(code);
			entry.callback();
			return entry.payload;
		} else {
			return null;
		}
	}
}
