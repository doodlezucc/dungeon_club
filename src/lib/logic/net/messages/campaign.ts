import type {
	AssetSnippet,
	CampaignCardSnippet,
	CampaignSnippet,
	TokenTemplateSnippet
} from '../snippets';
import type { DefinePrivateRequest, DefineServerBroadcast, UUID } from './messages';

export interface CampaignMessageCategory {
	campaignCreate: DefinePrivateRequest<
		{
			name: string;
		},
		CampaignSnippet
	>;

	campaignDelete: DefinePrivateRequest<
		{
			id: string;
		},
		void
	>;

	campaignReorder: DefinePrivateRequest<
		{
			campaignIds: string[];
		},
		void
	>;

	campaignEdit: DefinePrivateRequest<Omit<CampaignCardSnippet, 'createdAt'>, CampaignCardSnippet>;

	campaignHost: DefinePrivateRequest<
		{
			id: UUID;
		},
		CampaignSnippet
	>;

	campaignJoin: DefinePrivateRequest<
		{
			id: UUID;
		},
		CampaignSnippet
	>;

	tokenTemplateDelete: DefinePrivateRequest<
		{
			tokenTemplateId: UUID;
		},
		void
	>;

	tokenTemplateRestore: DefinePrivateRequest<
		{
			tokenTemplateId: UUID;
		},
		void
	>;

	tokenTemplateCreate: DefineServerBroadcast<{
		tokenTemplate: TokenTemplateSnippet;
	}>;

	assetCreate: DefineServerBroadcast<{
		asset: AssetSnippet;
	}>;
}
