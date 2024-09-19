import type { CampaignMessageCategory, OverridableTokenProperty } from 'shared';
import {
	applyTemplateInheritanceOnProperties,
	extractPropertiesFromTemplate,
	getInheritedPropertiesOfToken
} from 'shared/token-materializing';
import { SelectCampaignCard, SelectTokenProperties, SelectTokenTemplate } from '../../net/snippets';
import { prisma, server } from '../server';
import type { CategoryHandler } from '../socket';
import { generateUniqueString } from '../util/generate-string';

export const campaignHandler: CategoryHandler<CampaignMessageCategory> = {
	handleCampaignCreate: async ({ name }, { dispatcher }) => {
		const campaignId = await generateCampaignID();

		await prisma.account.update({
			where: { emailHash: dispatcher.loggedInAccountHash },
			data: {
				campaigns: {
					create: {
						name,
						id: campaignId
					}
				},
				campaignIdsOrdered: {
					push: campaignId
				}
			}
		});

		return dispatcher.enterSession(campaignId);
	},

	handleCampaignDelete: async ({ id }, { dispatcher }) => {
		const { campaigns, campaignIdsOrdered } = await prisma.account.findUniqueOrThrow({
			where: { emailHash: dispatcher.loggedInAccountHash },
			select: {
				campaigns: { select: { id: true } },
				campaignIdsOrdered: true
			}
		});

		const isOwner = campaigns.some((campaign) => campaign.id === id);

		if (!isOwner) {
			throw 'You must be the owner of this campaign to be able to delete it';
		}

		const selectedAssets = await prisma.campaign.findUniqueOrThrow({
			where: { id: id },
			select: {
				boards: {
					select: {
						mapImage: true
					}
				},
				templates: {
					select: {
						avatar: true
					}
				}
			}
		});

		const allAssets = [
			...selectedAssets.boards.map((board) => board.mapImage),
			...selectedAssets.templates
				.map((template) => template.avatar)
				.filter((asset) => asset != null)
		];

		await server.assetManager.disposeAssetsInBatch(allAssets);

		await prisma.account.update({
			where: { emailHash: dispatcher.loggedInAccountHash },
			data: {
				campaigns: {
					delete: { id: id }
				},
				campaignIdsOrdered: campaignIdsOrdered.filter((ownedId) => ownedId !== id)
			}
		});
	},

	handleCampaignReorder: async ({ campaignIds }, { dispatcher }) => {
		await prisma.account.updateArrayOrder({
			where: { emailHash: dispatcher.accountHash },
			arrayName: 'campaignIdsOrdered',
			updateTo: campaignIds
		});
	},

	handleCampaignEdit: async ({ id, name }, { dispatcher }) => {
		const campaignCard = await prisma.campaign.update({
			where: {
				ownerEmail: dispatcher.loggedInAccountHash,
				id: id
			},
			data: {
				name: name
			},
			select: SelectCampaignCard
		});

		return campaignCard;
	},

	handleCampaignHost: async ({ id }, { dispatcher }) => {
		const dispatcherAccount = await prisma.account.findUniqueOrThrow({
			where: { emailHash: dispatcher.loggedInAccountHash },
			select: {
				campaigns: { select: { id: true } }
			}
		});

		const isOwner = dispatcherAccount.campaigns.some((campaign) => campaign.id === id);

		if (!isOwner) {
			throw 'You must be the owner of this campaign to be able to host';
		}

		return await dispatcher.enterSession(id);
	},

	handleCampaignJoin: async ({ id }, { dispatcher }) => {
		return await dispatcher.enterSession(id);
	},

	handleTokenTemplateDelete: async ({ tokenTemplateId }, { dispatcher }) => {
		const session = dispatcher.sessionAsOwner;
		const campaignId = session.campaignId;

		const tokenTemplate = await prisma.tokenTemplate.findUnique({
			where: { id: tokenTemplateId },
			select: {
				...SelectTokenTemplate,
				...SelectTokenProperties,
				campaignId: true
			}
		});

		if (tokenTemplate?.campaignId !== campaignId) {
			throw 'Token template is not part of the hosted campaign';
		}

		const tokensInheritingTemplate = await prisma.token.findMany({
			where: { templateId: tokenTemplateId },
			select: {
				id: true,
				...SelectTokenProperties
			}
		});

		const tokenToInheritedPropertyMap: Record<string, OverridableTokenProperty[]> = {};

		for (const token of tokensInheritingTemplate) {
			// Remember inherited properties of each token (in case of an "undo")
			const inheritedProperties = getInheritedPropertiesOfToken(token);
			tokenToInheritedPropertyMap[token.id] = inheritedProperties;

			// Remove token template reference from each inheriting token
			await prisma.token.update({
				where: { id: token.id },
				data: {
					...extractPropertiesFromTemplate(tokenTemplate, inheritedProperties),
					templateId: null
				}
			});
		}

		session.garbage.tokenTemplates.markForDeletion(tokenTemplateId, {
			tokenTemplate: tokenTemplate,
			tokenToInheritedPropertyMap: tokenToInheritedPropertyMap
		});
	},

	handleTokenTemplateRestore: async ({ tokenTemplateId }, { dispatcher }) => {
		const session = dispatcher.sessionAsOwner;

		const { tokenToInheritedPropertyMap } = session.garbage.tokenTemplates.restore(tokenTemplateId);

		for (const [tokenId, inheritedProperties] of Object.entries(tokenToInheritedPropertyMap)) {
			await prisma.token.update({
				where: { id: tokenId },
				data: {
					...applyTemplateInheritanceOnProperties(inheritedProperties),
					templateId: tokenTemplateId
				}
			});
		}
	},

	// FIXME: Only here because [Server -> Client] broadcasts aren't yet possible to define under net/messages/*.
	handleAssetCreate: async (payload) => {
		return { forwardedResponse: payload };
	},

	// FIXME: Only here because [Server -> Client] broadcasts aren't yet possible to define under net/messages/*.
	handleTokenTemplateCreate: async (payload) => {
		return { forwardedResponse: payload };
	}
};

async function generateCampaignID() {
	return generateUniqueString({
		length: 5,
		doesExist: async (id) => {
			const existingCampaign = await prisma.campaign.findFirst({
				where: { id: id },
				select: null
			});

			return existingCampaign != null;
		}
	});
}
