<script lang="ts">
	import { historyOf } from '$lib/packages/undo-redo/history';
	import { socket } from 'client/communication';
	import { boardState, campaignState } from 'client/state';
	import { listenTo, ShortcutAction } from 'components/extensions/ShortcutListener.svelte';
	import SelectionGroup from 'components/groups/SelectionGroup.svelte';
	import type { TokenSnippet } from 'shared';
	import { getTemplateForToken } from 'shared/token-materializing';
	import { getContext } from 'svelte';
	import { derived } from 'svelte/store';
	import { type BoardContext } from './Board.svelte';
	import Token from './tokens/Token.svelte';
	import UnplacedToken, {
		exitTokenPlacement,
		unplacedTokenProperties,
		type TokenPlacementEvent
	} from './tokens/UnplacedToken.svelte';
	import * as Tokens from './tokens/token-management';

	const loadedBoardId = derived(boardState, (board) => board!.id);

	$: tokens = $boardState!.tokens;
	$: tokenTemplates = $campaignState!.templates;

	let tokenSelectionGroup = null as SelectionGroup<TokenSnippet> | null;
	let selectedTokens: TokenSnippet[];
	export let selectedTokenIds: string[] = [];

	$: {
		if ($loadedBoardId) {
			// Called whenever a board gets loaded
			tokenSelectionGroup?.clear();
		}
	}

	const board = getContext<BoardContext>('board');

	$: unplacedTokenSpawnPosition = $unplacedTokenProperties
		? board.transformClientToGridSpace({
				x: $unplacedTokenProperties.triggeringEvent.clientX,
				y: $unplacedTokenProperties.triggeringEvent.clientY
			})
		: null;

	export function clearSelection() {
		tokenSelectionGroup?.clear();
	}

	function buildContextForTokenManagement(): Tokens.Context {
		return {
			boardHistory: historyOf($loadedBoardId),
			socket: $socket
		};
	}

	function onPlaceToken(ev: CustomEvent<TokenPlacementEvent>) {
		Tokens.createNewToken(
			{
				position: ev.detail.position,
				tokenTemplateId: ev.detail.templateId ?? null,
				onServerSideCreation: (instantiatedToken) => {
					tokenSelectionGroup!.select(instantiatedToken, { additive: false });
				}
			},
			buildContextForTokenManagement()
		);
	}

	const onPressDelete = listenTo(ShortcutAction.Delete);
	$onPressDelete.handle(() => {
		if (selectedTokens.length > 0) {
			Tokens.deleteTokens(selectedTokens, buildContextForTokenManagement());
		}
	});

	const onPressEscape = listenTo(ShortcutAction.Escape);
	$onPressEscape.handle(() => {
		if ($unplacedTokenProperties) {
			exitTokenPlacement();
		}
	});
</script>

<SelectionGroup
	bind:this={tokenSelectionGroup}
	elements={tokens}
	getElementKey={(token) => token.id}
	bind:selectedElements={selectedTokens}
	bind:selectedKeys={selectedTokenIds}
	let:element
	let:isSelected
>
	<Token
		token={element}
		template={getTemplateForToken(element, tokenTemplates)}
		selected={isSelected}
	/>
</SelectionGroup>

{#if $unplacedTokenProperties && unplacedTokenSpawnPosition}
	{#key $unplacedTokenProperties.tokenTemplate?.id}
		<UnplacedToken
			template={$unplacedTokenProperties.tokenTemplate}
			spawnPosition={unplacedTokenSpawnPosition}
			on:place={onPlaceToken}
		/>
	{/key}
{/if}
