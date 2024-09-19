import type { AllMessages, Payload, Response } from '../messages';

export type SendMessage<SCOPE, T extends keyof SCOPE> = {
	name: T;
	payload: Payload<SCOPE, T>;

	/** If passed, this message is expected to receive a response marked with an identical channel value. */
	channel?: number;
};

export type ResponseMessage<SCOPE, T extends keyof SCOPE> = {
	response?: Response<SCOPE, T>;
	error?: string;
	channel: number;
};

export type AnySendMessage = SendMessage<AllMessages, keyof AllMessages>;
export type AnyResponseMessage = ResponseMessage<AllMessages, keyof AllMessages>;

export type AnyMessage = AnySendMessage | AnyResponseMessage;

export class MessageCodec {
	static encode(message: AnyMessage): string {
		return JSON.stringify(message);
	}

	static decode(encodedMessage: string): AnyMessage {
		return JSON.parse(encodedMessage);
	}
}
