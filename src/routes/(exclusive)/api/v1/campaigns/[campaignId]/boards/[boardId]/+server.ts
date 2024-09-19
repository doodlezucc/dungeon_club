import { error, json } from '@sveltejs/kit';
import { authorizedEndpoint } from 'server/rest.js';
import { prisma } from 'server/server.js';

export const GET = ({ request, params }) =>
	authorizedEndpoint(request, async (accountHash) => {
		const board = await prisma.board.findFirstOrThrow({
			where: {
				id: params.boardId,
				campaignId: params.campaignId
			},
			include: {
				campaign: { select: { ownerEmail: true } }
			}
		});

		if (board.campaign.ownerEmail !== accountHash) {
			throw error(403);
		}

		return json(board);
	});
