<script lang="ts" context="module">
	export interface HistoryTokenMovement {
		tokenId: string;
		position: Record<Direction, Position>;
	}
</script>

<script lang="ts">
	import type { Position } from '$lib/compounds';
	import type { Direction } from '$lib/packages/undo-redo/action';
	import { historyOf } from '$lib/packages/undo-redo/history';
	import { socket } from 'client/communication';
	import { Board, boardState } from 'client/state';
	import {
		KeyState,
		derivedKeyStateModifySelection,
		keyStateOf
	} from 'components/extensions/ShortcutListener.svelte';
	import type { SelectionContext } from 'components/groups/SelectionGroup.svelte';
	import type { TokenSnippet, TokenTemplateSnippet } from 'shared';
	import { materializeToken } from 'shared/token-materializing';
	import { getContext } from 'svelte';
	import type { BoardContext } from '../Board.svelte';
	import TokenBase from './TokenBase.svelte';
	import * as Tokens from './token-management';

	export let token: TokenSnippet;
	export let template: TokenTemplateSnippet | undefined;
	export let selected: boolean;

	$: properties = materializeToken(token, template);

	$: position = <Position>{ x: token.x, y: token.y };
	$: displaySize = properties.size;

	const selection = getContext<SelectionContext<TokenSnippet>>('selection');

	const { transformClientToGridSpace } = getContext<BoardContext>('board');

	$: isDragging = false;
	let positionBeforeDragging = position;
	let previousDragPosition = position;

	function onDragToggle(dragState: boolean) {
		isDragging = dragState;

		if (dragState) {
			positionBeforeDragging = position;
			previousDragPosition = position;
		} else {
			onDraggedTo(position, positionBeforeDragging);
		}
	}

	function onDraggedTo(position: Position, originalPosition: Position) {
		Tokens.submitTokenMovement(
			{
				selection: selection.getSelected(),
				delta: {
					x: position.x - originalPosition.x,
					y: position.y - originalPosition.y
				}
			},
			{
				boardHistory: historyOf($boardState!.id),
				socket: $socket
			}
		);
	}

	const activeGridSpace = Board.instance.grid.gridSpace;
	const isGridSnappingDisabled = keyStateOf(KeyState.DisableGridSnapping);

	function handleDragging(ev: MouseEvent) {
		const mouseInGridSpace = transformClientToGridSpace({ x: ev.clientX, y: ev.clientY });

		let dragPosition: Position;

		if ($isGridSnappingDisabled) {
			dragPosition = {
				x: mouseInGridSpace.x,
				y: mouseInGridSpace.y * $activeGridSpace!.tileHeightRatio
			};
		} else {
			const snapped = $activeGridSpace!.snapShapeToGrid({
				center: mouseInGridSpace,
				size: displaySize
			});

			dragPosition = snapped;
		}

		const delta = <Position>{
			x: dragPosition.x - previousDragPosition.x,
			y: dragPosition.y - previousDragPosition.y
		};

		previousDragPosition = dragPosition;

		Board.instance.put((board) => ({
			...board,
			tokens: board.tokens.map((token) => {
				if (selection.includes(token)) {
					return {
						...token,
						x: token.x + delta.x,
						y: token.y + delta.y
					};
				}

				return token;
			})
		}));
	}

	const doModifySelection = derivedKeyStateModifySelection();

	function handleSelect() {
		selection.select(token, { additive: $doModifySelection });
	}
</script>

<TokenBase
	{properties}
	{position}
	style={{
		selected,
		dragging: isDragging,
		transparent: false
	}}
	draggableParams={{
		onDragToggle,
		handleDragging
	}}
	on:mousedown={() => {
		if (!selected) handleSelect();
	}}
	on:mouseup={() => {
		const wasDraggedJustNow = isDragging;

		if (!wasDraggedJustNow) {
			if (selected) handleSelect();
		}
	}}
/>
