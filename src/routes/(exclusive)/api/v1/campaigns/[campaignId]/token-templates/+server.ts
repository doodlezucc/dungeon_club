import { json } from '@sveltejs/kit';
import { prisma } from 'server/prisma.js';
import { campaignEndpoint } from 'server/rest.js';
import { server } from 'server/server.js';
import { SelectTokenTemplate } from 'shared';

export const POST = ({ params: { campaignId }, request }) =>
	campaignEndpoint(request, campaignId, async () => {
		const asset = await server.assetManager.uploadAsset(campaignId, request);

		const tokenTemplate = await prisma.tokenTemplate.create({
			data: {
				campaignId: campaignId,
				avatarId: asset.id,
				name: 'Token'
			},
			select: SelectTokenTemplate
		});

		server.sessionManager.findSession(campaignId)?.broadcastMessage('tokenTemplateCreate', {
			tokenTemplate: tokenTemplate
		});

		return json(tokenTemplate);
	});
