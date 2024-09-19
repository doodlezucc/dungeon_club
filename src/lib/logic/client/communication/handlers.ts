import { Board, Campaign } from 'client/state';
import {
	MessageHandler,
	type AccountMessageCategory,
	type BoardMessageCategory,
	type CampaignMessageCategory,
	type CategoryHandlers,
	type ClientHandledMessages
} from 'shared';

type Options = {};

export class ClientRequestHandler extends MessageHandler<ClientHandledMessages, Options> {
	account: CategoryHandlers<AccountMessageCategory, ClientHandledMessages, Options> = {};

	board: CategoryHandlers<BoardMessageCategory, ClientHandledMessages, Options> = {
		onBoardPlay: (boardSnippet) => {
			Board.instance.load(boardSnippet);
		},

		onTokenCreate: (payload) => Board.instance.handleTokenCreate(payload),
		onTokensDelete: (payload) => Board.instance.handleTokensDelete(payload),
		onTokensMove: (payload) => Board.instance.handleTokensMove(payload),
		onTokensEdit: (payload) => Board.instance.handleTokensEdit(payload)
	};

	campaign: CategoryHandlers<CampaignMessageCategory, ClientHandledMessages, Options> = {
		onAssetCreate: (payload) => Campaign.instance.handleAssetCreate(payload),
		onTokenTemplateCreate: (payload) => Campaign.instance.handleTokenTemplateCreate(payload)
	};
}
