import {
	MessageSocket,
	type ClientHandledMessages,
	type ClientSentMessages,
	type Payload,
	type ResponseObject
} from 'shared';
import { readonly, writable } from 'svelte/store';
import { ClientRequestHandler } from './handlers';

const _socket = writable<ClientSocket>(undefined);
export const socket = readonly(_socket);

export const getSocket = () => ClientSocket.instance;

export class ClientSocket extends MessageSocket<ClientHandledMessages, ClientSentMessages> {
	public static instance: ClientSocket;

	private readonly handler = new ClientRequestHandler();
	private readonly webSocket: WebSocket;

	constructor() {
		super({ unready: true });

		ClientSocket.instance = this;
		_socket.set(this);

		const ws = connectToWebSocketServer();

		ws.addEventListener('open', () => {
			console.log('Connection opened!');
			this.markAsReady();
		});
		ws.addEventListener('message', (ev) => {
			this.receiveIncomingMessage(ev.data);
		});
		ws.addEventListener('error', (ev) => {
			console.error('WebSocket error!', ev);
		});
		ws.addEventListener('close', (ev) => {
			console.log('Connection closed!', ev);
		});
		this.webSocket = ws;
	}

	protected processMessage<T extends keyof ClientHandledMessages>(
		name: T,
		payload: Payload<ClientHandledMessages, T>
	): Promise<ResponseObject<ClientHandledMessages, T>> {
		return this.handler.handle<T>(name, payload, {});
	}

	protected sendOutgoingMessage(encodedMessage: string): void {
		this.webSocket.send(encodedMessage);
	}
}

function connectToWebSocketServer() {
	const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
	return new WebSocket(`${protocol}//${window.location.host}/websocket`);
}
