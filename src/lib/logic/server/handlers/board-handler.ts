import { Limits as LIMITS } from 'server/limits';
import { publicResponse, type BoardMessageCategory } from 'shared';
import { SelectBoard, SelectToken } from '../../net/snippets';
import { prisma } from '../server';
import type { CategoryHandler } from '../socket';

export const boardHandler: CategoryHandler<BoardMessageCategory> = {
	handleBoardEdit: async ({ id: boardId }, { dispatcher }) => {
		const campaignId = dispatcher.sessionAsOwner.campaignId;

		const boardSnippet = await prisma.board.findFirstOrThrow({
			where: {
				campaignId: campaignId,
				id: boardId
			},
			select: SelectBoard
		});

		dispatcher.sessionConnection.visibleBoardIdOrNull = boardId;

		return boardSnippet;
	},

	handleBoardPlay: async ({ id: boardId }, { dispatcher }) => {
		const session = dispatcher.sessionAsOwner;
		const campaignId = session.campaignId;

		const boardSnippet = await prisma.board.findFirstOrThrow({
			where: {
				campaignId: campaignId,
				id: boardId
			},
			select: SelectBoard
		});

		await prisma.campaign.update({
			where: { id: campaignId },
			data: {
				selectedBoardId: boardId
			}
		});

		for (const user of session.users) {
			user.sessionConnection.visibleBoardIdOrNull = boardId;
		}

		return publicResponse(boardSnippet);
	},

	handleTokenCreate: async ({ templateId, x, y }, { dispatcher }) => {
		const sessionCampaignId = dispatcher.sessionAsOwner.campaignId;
		const boardId = dispatcher.sessionConnection.visibleBoardId;

		const {
			campaignId,
			_count: { tokens: currentTokenCount }
		} = await prisma.board.findUniqueOrThrow({
			where: {
				id: boardId
			},
			select: {
				campaignId: true,
				_count: {
					select: {
						tokens: true
					}
				}
			}
		});

		if (sessionCampaignId !== campaignId) {
			throw 'Board is not part of the hosted campaign';
		}

		if (currentTokenCount + 1 > LIMITS.tokensPerBoard) {
			throw 'Resulting token count exceeds maximum tokens per board';
		}

		const createdToken = await prisma.token.create({
			data: {
				boardId,
				templateId: templateId,
				x: x,
				y: y
			},
			select: SelectToken
		});

		return publicResponse({
			boardId,
			token: createdToken
		});
	},

	handleTokensDelete: async (payload, { dispatcher }) => {
		const visibleBoardId = dispatcher.sessionConnectionAsOwner.visibleBoardId;
		const validTokens = await prisma.token.findMany({
			where: {
				id: { in: payload.tokenIds },
				boardId: visibleBoardId
			},
			select: SelectToken
		});

		const sessionGarbage = dispatcher.sessionAsOwner.garbage;
		for (const token of validTokens) {
			sessionGarbage.tokens.markForDeletion(token.id, {
				boardId: visibleBoardId,
				token: token
			});
		}

		const validTokenIds = validTokens.map((token) => token.id);
		return {
			forwardedResponse: {
				tokenIds: validTokenIds
			}
		};
	},

	handleTokensRestore: async (payload, { dispatcher }) => {
		const session = dispatcher.sessionAsOwner;

		const restoredInfos = session.garbage.tokens.restoreMany(payload.tokenIds);

		for (const participant of session.users) {
			for (const restoredTokenInfo of restoredInfos) {
				participant.connection.send('tokenCreate', {
					boardId: restoredTokenInfo.boardId,
					token: restoredTokenInfo.token
				});
			}
		}
	},

	handleTokensEdit: async (payload, { dispatcher }) => {
		const { editedTokenTemplate, editedTokens } = payload;

		const campaignId = dispatcher.sessionAsOwner.campaignId;
		const boardId = dispatcher.sessionConnection.visibleBoardId;

		if (editedTokenTemplate) {
			// Edits affect a token template
			await prisma.tokenTemplate.update({
				where: { campaignId: campaignId, id: editedTokenTemplate.tokenTemplateId },
				data: editedTokenTemplate.newProperties
			});
		}

		for (const tokenId in editedTokens) {
			await prisma.token.update({
				where: { boardId: boardId, id: tokenId },
				data: editedTokens[tokenId]
			});
		}

		return {
			forwardedResponse: payload
		};
	},

	handleTokensMove: async (payload, { dispatcher }) => {
		const boardId = dispatcher.sessionConnection.visibleBoardId;

		for (const tokenId in payload) {
			const position = payload[tokenId];

			await prisma.token.update({
				where: { boardId: boardId, id: tokenId },
				data: {
					x: position.x,
					y: position.y
				}
			});
		}

		return {
			forwardedResponse: payload
		};
	}
};
