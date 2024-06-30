import { authorizedEndpoint } from '$lib/server/rest.js';
import { prisma } from '$lib/server/server.js';
import { error, json } from '@sveltejs/kit';

export const GET = ({ request, params }) =>
	authorizedEndpoint(request, async (accountId) => {
		const board = await prisma.board.findFirstOrThrow({
			where: {
				id: params.boardId,
				campaignId: params.campaignId
			},
			include: {
				campaign: { select: { ownerId: true } }
			}
		});

		if (board.campaign.ownerId !== accountId) {
			throw error(403);
		}

		return json(board);
	});