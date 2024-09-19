import type { IncomingMessage } from 'http';
import type { Duplex } from 'stream';
import { WebSocketServer } from 'ws';

// Adapted from https://github.com/suhaildawood/SvelteKit-integrated-WebSocket

const globalThisWSS = Symbol.for('sveltekit.wss');

type ExtendedGlobal = typeof globalThis & {
	[globalThisWSS]: WebSocketServer;
};

export function getWebSocketServer() {
	return (globalThis as ExtendedGlobal)[globalThisWSS];
}

export function makeWebSocketUpgradeHandler(webSocketPath: string) {
	function handleHttpUpgrade(req: IncomingMessage, sock: Duplex, head: Buffer) {
		const pathName = req.url; // req.url only returns the URL path, e.g. "/", "/home" or "/websocket"
		if (pathName !== webSocketPath) {
			// Ignore any upgrade requests which don't match the specified path
			return;
		}

		const wss = getWebSocketServer();

		wss.handleUpgrade(req, sock, head, (ws) => {
			wss.emit('connection', ws, req);
		});
	}

	return handleHttpUpgrade;
}

export const createWSSGlobalInstance = () => {
	const wss = new WebSocketServer({ noServer: true });

	(globalThis as ExtendedGlobal)[globalThisWSS] = wss;

	return wss;
};
