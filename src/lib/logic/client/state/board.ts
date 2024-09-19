import { GridSpaces } from '$lib/packages/grid/grid-snapping';
import type { GridSpace } from '$lib/packages/grid/spaces/interface';
import { historyOf } from '$lib/packages/undo-redo/history';
import type { BoardSnippet, GetForwarded, GetPayload, GetResponse, TokenSnippet } from 'shared';
import { derived, type Readable } from 'svelte/store';
import { getSocket } from '../communication';
import { focusedHistory } from './focused-history';
import { Campaign } from './session';
import { WithState } from './with-state';

export class BoardGrid {
	readonly gridSpace: Readable<GridSpace | null>;

	constructor(readonly board: Board) {
		this.gridSpace = derived(board.state, (boardState) => {
			return boardState ? GridSpaces.parse(boardState.gridType) : null;
		});
	}
}

export interface BoardSelectOptions {
	boardId: string;
	mode: 'edit' | 'play';
}

export class Board extends WithState<BoardSnippet> {
	static readonly instance = new Board();
	static readonly state = this.instance.state;

	readonly grid = new BoardGrid(this);

	readonly tokens = this.derived(
		(board) => board.tokens,
		(board, tokens) => ({
			...board,
			tokens: tokens
		})
	);

	load(snippet: BoardSnippet) {
		this.set(snippet);
		focusedHistory.set(historyOf(snippet.id));
	}

	async request({ boardId, mode }: BoardSelectOptions) {
		let snippet: BoardSnippet;

		if (mode === 'edit') {
			snippet = await getSocket().request('boardEdit', { id: boardId });
		} else {
			snippet = await getSocket().request('boardPlay', { id: boardId });
		}

		this.load(snippet);
	}

	handleTokensMove(payload: GetPayload<'tokensMove'>) {
		this.applyChangesToTokens(payload);
	}

	handleTokensEdit(payload: GetPayload<'tokensEdit'>) {
		if (payload.editedTokenTemplate) {
			const { tokenTemplateId, newProperties } = payload.editedTokenTemplate;

			Campaign.instance.tokenTemplates.update((allTokenTemplates) => {
				return allTokenTemplates.map((tokenTemplate) => {
					if (tokenTemplate.id !== tokenTemplateId) return tokenTemplate;

					// Inject updated properties into template
					return {
						...tokenTemplate,
						...newProperties
					};
				});
			});
		}

		this.applyChangesToTokens(payload.editedTokens);
	}

	private applyChangesToTokens(tokenPropertiesMap: Record<string, Partial<TokenSnippet>>) {
		this.put((board) => ({
			...board,
			tokens: board.tokens.map((token) => {
				const isTokenAffected = token.id in tokenPropertiesMap;

				if (isTokenAffected) {
					const newTokenProperties = tokenPropertiesMap[token.id];
					return { ...token, ...newTokenProperties };
				}

				return token;
			})
		}));
	}

	handleTokenCreate({ boardId, token }: GetResponse<'tokenCreate'>) {
		this.put((board) =>
			board.id !== boardId
				? board
				: {
						...board,
						tokens: [...board.tokens, token]
					}
		);
	}

	handleTokensDelete({ tokenIds: deletedTokenIds }: GetForwarded<'tokensDelete'>) {
		this.put((board) => ({
			...board,
			tokens: board.tokens.filter((token) => !deletedTokenIds.includes(token.id))
		}));
	}
}

export const boardState = Board.state;
