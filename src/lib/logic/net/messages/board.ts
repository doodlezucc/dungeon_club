import type { Position } from '$lib/compounds';
import type {
	BoardSnippet,
	TokenProperties,
	TokenPropertiesOrNull,
	TokenSnippet
} from '../snippets';
import type {
	DefinePrivateRequest,
	DefineRequestWithPublicResponse,
	DefineSendAndForward,
	UUID
} from './messages';

export interface BoardMessageCategory {
	boardEdit: DefinePrivateRequest<
		{
			id: UUID;
		},
		BoardSnippet
	>;

	boardPlay: DefineRequestWithPublicResponse<
		{
			id: UUID;
		},
		BoardSnippet
	>;

	tokenCreate: DefineRequestWithPublicResponse<
		{
			templateId: string | null;
			x: number;
			y: number;
		},
		{
			boardId: UUID;
			token: TokenSnippet;
		}
	>;

	tokensDelete: DefineSendAndForward<{
		tokenIds: UUID[];
	}>;

	tokensRestore: DefinePrivateRequest<
		{
			tokenIds: UUID[];
		},
		void
	>;

	tokensEdit: DefineSendAndForward<{
		editedTokenTemplate?: {
			tokenTemplateId: string;
			newProperties: TokenProperties;
		};
		editedTokens: {
			[id: UUID]: TokenPropertiesOrNull;
		};
	}>;

	tokensMove: DefineSendAndForward<{
		[id: UUID]: Position;
	}>;
}
