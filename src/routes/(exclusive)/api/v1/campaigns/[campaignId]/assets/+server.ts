import { json } from '@sveltejs/kit';
import { campaignEndpoint } from 'server/rest.js';
import { prisma, server } from 'server/server.js';

export const GET = ({ params: { campaignId }, request }) =>
	campaignEndpoint(request, campaignId, async () => {
		const allAssets = await prisma.asset.findMany({
			where: { campaignId: campaignId }
		});

		return json({
			items: allAssets
		});
	});

export const POST = ({ params: { campaignId }, request }) =>
	campaignEndpoint(request, campaignId, async () => {
		const asset = await server.assetManager.uploadAsset(campaignId, request);

		return json(asset);
	});
