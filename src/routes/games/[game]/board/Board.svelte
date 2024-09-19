<script lang="ts" context="module">
	export interface BoardContext {
		transformClientToGridSpace: (position: Position) => Position;
		transformGridToClientSpace: (position: Position) => Position;
		getPanViewEventTarget(): EventTarget;
	}
</script>

<script lang="ts">
	import type { Position, Size } from '$lib/compounds';
	import { Board, boardState } from 'client/state/board';
	import { PanView } from 'components';
	import { derivedKeyStateModifySelection } from 'components/extensions/ShortcutListener.svelte';
	import { Overlay } from 'components/layout';
	import { setContext } from 'svelte';
	import BattleMap from './BattleMap.svelte';
	import BoardTokens from './BoardTokens.svelte';
	import Grid from './grid/Grid.svelte';

	const activeGridSpace = Board.instance.grid.gridSpace;
	const tileHeightRatio = $activeGridSpace?.tileHeightRatio ?? 1;

	const cellsPerRow = $boardState!.gridCellsPerRow;

	let position = <Position>{ x: 0, y: 0 };
	let zoom = 0;

	let dimensions = undefined as Size | undefined;

	$: cellSize = (dimensions?.width ?? 0) / cellsPerRow;

	let tokenContainer: BoardTokens;
	export let selectedTokenIds: string[] = [];

	let contentElement: HTMLElement;
	let cachedClientRect = undefined as DOMRect | undefined;

	$: {
		// Clear cached client rect when position or zoom change
		if (position && zoom != undefined) {
			cachedClientRect = undefined;
		}
	}

	const keepTokenSelection = derivedKeyStateModifySelection();
	function onClickEmptySpace() {
		if (!$keepTokenSelection) {
			tokenContainer.clearSelection();
		}
	}

	function getClientRect() {
		return (cachedClientRect ??= contentElement.getBoundingClientRect());
	}

	function transformClientToGridSpace(clientPosition: Position): Position {
		const rect = getClientRect();

		const zoomFactor = Math.exp(zoom);
		const factor = zoomFactor * cellSize;

		return {
			x: (clientPosition.x - rect.x) / factor,
			y: (clientPosition.y - rect.y) / (factor * tileHeightRatio)
		};
	}

	function transformGridToClientSpace(position: Position): Position {
		throw 'Not implemented';
	}

	let panViewElement: HTMLElement | undefined;

	setContext<BoardContext>('board', {
		transformClientToGridSpace,
		transformGridToClientSpace,

		getPanViewEventTarget: () => panViewElement!
	});
</script>

<PanView
	expand
	bind:position
	bind:zoom
	bind:elementView={panViewElement}
	bind:elementContent={contentElement}
	on:click={onClickEmptySpace}
>
	<div class="board" style="--cell-size: {cellSize}px; --cell-grow-factor: {tileHeightRatio};">
		<BattleMap bind:size={dimensions} />

		{#if dimensions}
			<Overlay>
				<Grid {dimensions} {cellsPerRow} />
			</Overlay>

			<Overlay>
				<BoardTokens bind:this={tokenContainer} bind:selectedTokenIds />
			</Overlay>
		{/if}
	</div>
</PanView>

<style>
	.board {
		position: relative;
		display: flex;
		align-self: center;
		pointer-events: stroke;
	}

	.board {
		pointer-events: none;
	}
</style>
