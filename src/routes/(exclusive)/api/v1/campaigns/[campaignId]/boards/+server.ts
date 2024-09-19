import { json } from '@sveltejs/kit';
import { campaignEndpoint } from 'server/rest.js';
import { prisma, server } from 'server/server.js';

export const POST = ({ params: { campaignId }, request }) =>
	campaignEndpoint(request, campaignId, async (campaign) => {
		const asset = await server.assetManager.uploadAsset(campaignId, request);

		const board = await prisma.board.create({
			data: {
				campaignId: campaignId,
				mapImageId: asset.id
			},
			select: {
				id: true
			}
		});

		if (campaign.selectedBoardId === null) {
			await prisma.campaign.update({
				where: { id: campaignId },
				data: { selectedBoardId: board.id }
			});
		}

		return json({
			boardId: board.id
		});
	});
