import { env } from '$env/dynamic/private';
import type { WebSocket } from 'ws';
import { AccountManager } from './account-manager';
import { AssetManager } from './asset-manager';
import { prisma } from './prisma';
import { MailService } from './services/mail-service';
import { GmailMailService } from './services/mail/service-gmail';
import { SMTPMailService } from './services/mail/service-smtp';
import { SessionManager } from './session';
import { ConnectionSocket } from './socket';
import { getWebSocketServer } from './ws-server/ws-server';

export { prisma };

export class Server {
	readonly accountManager = new AccountManager();
	readonly assetManager = new AssetManager();
	readonly sessionManager = new SessionManager();
	readonly webSocketManager = new WebSocketManager();

	readonly mailService: MailService = Server.parseMailServiceType(env.MAIL_SERVICE);

	static parseMailServiceType(mailServiceType: string): MailService {
		switch (mailServiceType) {
			case 'gmail':
				return new GmailMailService();
			case 'smtp':
				return new SMTPMailService();
			default:
				throw `Unsupported mail service "${mailServiceType}"`;
		}
	}

	async start() {
		this.webSocketManager.start();
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
