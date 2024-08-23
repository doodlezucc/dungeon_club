import type { CampaignCardSnippet, CampaignSnippet } from '../snippets';
import type { DefinePrivateRequest, UUID } from './messages';

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
}
