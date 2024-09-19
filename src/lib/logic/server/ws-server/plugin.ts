import type { Plugin } from 'vite';
import { createWSSGlobalInstance, makeWebSocketUpgradeHandler } from './ws-server';

interface Options {
	/**
	 * Path at which a connection to the WebSocket server can be established.
	 *
	 * For example, setting this to `/websocket` would allow clients to connect to `wss://<your page url>/websocket`.
	 */
	handledPath: string;
}

export function webSocketServer(options: Options): Plugin<{}> {
	const onHttpUpgrade = makeWebSocketUpgradeHandler(options.handledPath);

	return {
		name: 'Web Socket Server',
		configureServer(server) {
			createWSSGlobalInstance();
			server.httpServer?.on('upgrade', onHttpUpgrade);
		},
		configurePreviewServer(server) {
			createWSSGlobalInstance();
			server.httpServer?.on('upgrade', onHttpUpgrade);
		}
	};
}
