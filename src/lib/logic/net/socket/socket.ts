import type { OptionalForwarded, Payload, Response, ResponseObject } from '../messages';
import {
	MessageCodec,
	type AnyMessage,
	type AnyResponseMessage,
	type AnySendMessage,
	type ResponseMessage,
	type SendMessage
} from './codec';

type ChannelCallback<S, T extends keyof S> = (response: ResponseMessage<S, T>) => void;
type ChannelCallbackMap<S> = Map<number, ChannelCallback<S, keyof S>>;

interface Props {
	unready: boolean;
}
const defaultProps: Props = {
	unready: false
};

export abstract class MessageSocket<HANDLED, SENT> {
	private readonly activeChannelCallbacks: ChannelCallbackMap<SENT> = new Map();

	private readonly readyEvent: Promise<void>;
	private resolveReadyState?: () => void;
	private isReady: boolean = false;

	constructor(props?: Partial<Props>) {
		const { unready } = {
			...defaultProps,
			...props
		};

		if (unready) {
			this.readyEvent = new Promise<void>((resolve) => {
				this.resolveReadyState = resolve;
			});
		} else {
			this.isReady = true;
			this.readyEvent = Promise.resolve();
		}
	}

	protected markAsReady() {
		this.isReady = true;
		if (this.resolveReadyState) {
			this.resolveReadyState();
		}
	}

	private findUnusedChannel(): number {
		const countActiveChannels = this.activeChannelCallbacks.size;

		for (let channel = 0; channel < countActiveChannels; channel++) {
			if (!this.activeChannelCallbacks.has(channel)) {
				return channel;
			}
		}

		return countActiveChannels;
	}

	public send<T extends keyof SENT>(
		name: T,
		payload: Payload<SENT, T> | OptionalForwarded<HANDLED, T>
	) {
		this.sendMessage({
			name,
			payload
		} as AnyMessage);
	}

	public async request<T extends keyof SENT>(
		name: T,
		payload: Payload<SENT, T> | OptionalForwarded<HANDLED, T>
	): Promise<Response<SENT, T>> {
		return new Promise((resolve, reject) => {
			const channel = this.findUnusedChannel();

			this.activeChannelCallbacks.set(channel, (responseMessage) => {
				const { error, response: payload } = responseMessage;

				if (error) {
					reject(new RequestError(error));
				} else {
					resolve(payload as Response<SENT, T>);
				}
			});

			this.sendMessage({
				name,
				channel,
				payload
			} as AnySendMessage);
		});
	}

	private handleResponse(response: ResponseMessage<SENT, keyof SENT>) {
		const { channel } = response;

		const triggerCallback = this.activeChannelCallbacks.get(channel);

		if (triggerCallback) {
			this.activeChannelCallbacks.delete(channel);

			triggerCallback(response);
		} else {
			console.error(`No callback registered for response channel ${channel}`);
		}
	}

	private async handleMessage<T extends keyof HANDLED>(message: SendMessage<HANDLED, T>) {
		const { name, payload, channel } = message;

		try {
			const result = (await this.processMessage(name, payload)) as ResponseObject<HANDLED, T>;

			let responsePayload = result as Response<HANDLED, T>;

			if (result && typeof result === 'object') {
				if ('forwardedResponse' in result) {
					const forwardedName = name as unknown as keyof SENT;
					const forwardedPayload = result.forwardedResponse as Payload<SENT, typeof forwardedName>;

					this.broadcastToPeers(forwardedName, forwardedPayload);
				}
				if ('response' in result) {
					responsePayload = result.response as Response<HANDLED, T>;
				}
			}

			if (channel !== undefined) {
				// Communication partner wants to receive a response on this channel
				this.sendMessage({
					channel,
					response: responsePayload
				} as AnyResponseMessage);
			}
		} catch (err) {
			console.error('Error while processing message <', name, '>', payload);
			console.error(err);

			if (channel !== undefined) {
				this.sendMessage({
					channel,
					error: `${err}`
				} as AnyResponseMessage);
			}
		}
	}

	private async handleIncomingMessage(
		incoming: ResponseMessage<SENT, keyof SENT> | SendMessage<HANDLED, keyof HANDLED>
	) {
		if ('payload' in incoming) {
			return this.handleMessage(incoming);
		} else {
			this.handleResponse(incoming);
		}
	}

	private async sendMessage(message: AnyMessage) {
		if (!this.isReady) {
			await this.readyEvent;
		}

		const encodedMessage = MessageCodec.encode(message as AnyMessage);
		this.sendOutgoingMessage(encodedMessage);
	}

	protected receiveIncomingMessage(encodedMessage: string) {
		const incoming = MessageCodec.decode(encodedMessage);
		this.handleIncomingMessage(
			incoming as ResponseMessage<SENT, keyof SENT> | SendMessage<HANDLED, keyof HANDLED>
		);
	}

	private broadcastToPeers<T extends keyof SENT>(name: T, payload: Payload<SENT, T>) {
		for (const peerSocket of this.getPeers()) {
			peerSocket.send(name, payload);
		}
	}

	protected abstract processMessage<T extends keyof HANDLED>(
		name: T,
		payload: Payload<HANDLED, T>
	): Promise<ResponseObject<HANDLED, T>>;
	protected abstract sendOutgoingMessage(encodedMessage: string): void;
	protected getPeers(): MessageSocket<HANDLED, SENT>[] {
		return [];
	}
}

export class RequestError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'RequestError';
	}
}
