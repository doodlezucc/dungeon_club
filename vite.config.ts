import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { webSocketServer } from './src/lib/logic/server/ws-server/plugin';

export default defineConfig({
	plugins: [
		sveltekit(),
		webSocketServer({
			handledPath: '/websocket'
		})
	],
	assetsInclude: '**/*.mjml',
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
