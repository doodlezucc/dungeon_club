import type { WebSocket } from 'ws';
import { AccountManager } from './account-manager';
import { AssetManager } from './asset-manager';
import { prisma } from './prisma';
import type { MailService } from './services/mail-service';
import { GmailMailService } from './services/mail/service-gmail';
import { SessionManager } from './session';
import { ConnectionSocket } from './socket';
import { getWebSocketServer } from './ws-server/ws-server';
import {SMTPMailService} from "./services/mail/service-smtp";

export { prisma };

export class Server {
	readonly accountManager = new AccountManager();
	readonly assetManager = new AssetManager();
	readonly sessionManager = new SessionManager();
	readonly webSocketManager = new WebSocketManager();

	readonly mailService: MailService;

	async start() {
		this.webSocketManager.start();
	}

	constructor() {
		switch (process.env.MAIL_SERVICE) {
			case 'gmail':
				this.mailService = new GmailMailService();
				break;
			case 'smtp':
				this.mailService = new SMTPMailService();
				break;
			default:
				// TODO: Add a warning here, but then default to the Dummy mailer from the other PR
				throw new Error('Unsupported mail service');
		}
	}
}

class WebSocketManager {
	private connectionSockets: ConnectionSocket[] = [];

	start() {
		const wss = getWebSocketServer();
		wss.removeAllListeners();
		wss.on('connection', (socket) => this.onConnect(socket));
	}

	onConnect(webSocket: WebSocket) {
		const connectionSocket = new ConnectionSocket(webSocket);

		webSocket.on('close', (code) => {
			this.onDisconnect(connectionSocket, code);
		});

		this.connectionSockets.push(connectionSocket);
	}

	private onDisconnect(disconnectedSocket: ConnectionSocket, code: number) {
		console.log('Closing connection with code', code);
		disconnectedSocket.dispose();

		this.connectionSockets = this.connectionSockets.filter(
			(socket) => socket !== disconnectedSocket
		);
	}
}

export const server = new Server();
