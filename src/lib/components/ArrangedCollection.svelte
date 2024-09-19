<script lang="ts" context="module">
	import type { Position } from './compounds';

	export interface DragController {
		start: () => void;
		isDragging: Readable<boolean>;
	}

	export interface DragState {
		controller: DragController;
		center?: Position;
		isAnyDragging: Readable<boolean>;
		setItemCenter: (position: Position) => void;
	}
</script>

<script lang="ts" generics="T">
	import { createEventDispatcher } from 'svelte';
	import { derived, writable, type Readable } from 'svelte/store';

	import { fly } from 'svelte/transition';
	import Arrangable from './Arrangable.svelte';

	export let items: Array<T>;
	export let customDragHandling = false;

	let draggedItem = writable<T | null>(null);
	let isAnyDragging = derived(draggedItem, (dragged) => dragged != null);

	$: mousePosition = <Position>{ x: 0, y: 0 };

	$: dragStates = new Map<T, DragState>();

	$: {
		const previouslyRegistered = [...dragStates.keys()];

		for (const registeredItem of previouslyRegistered) {
			if (!items.includes(registeredItem)) {
				dragStates.delete(registeredItem);
			}
		}
	}

	const dispatch = createEventDispatcher<{
		reorder: undefined;
	}>();

	function registerDragState(item: T) {
		$draggedItem = null;
		const newState = <DragState>{
			isAnyDragging,
			setItemCenter: (center) => {
				newState.center = center;
			},
			controller: {
				isDragging: derived(draggedItem, (activeItem) => activeItem == item),
				start: () => {
					$draggedItem = item;
				}
			}
		};

		dragStates = dragStates.set(item, newState);
		return newState;
	}

	$: itemsPlus = [
		...items.map((item) => [item, dragStates.get(item) ?? registerDragState(item)]),
		null
	] as [T, DragState][];

	function sqrDistance(a: Position, b: Position) {
		const x = b.x - a.x;
		const y = b.y - a.y;
		return x * x + y * y;
	}

	function onDrag(entry: [T, DragState], ev: CustomEvent<Position>) {
		const [item, { center }] = entry;

		if (!center) return;

		let target = item;
		let targetDistance = -1;

		for (const entry of dragStates.entries()) {
			const [otherItem, { center: otherItemCenter }] = entry;

			const distance = sqrDistance(mousePosition, otherItemCenter!);
			if (distance < targetDistance || targetDistance < 0) {
				targetDistance = distance;
				target = otherItem;
			}
		}

		if (target != item) {
			// Found a better place to put this item
			items = items.map((originalItem) => {
				if (originalItem == item) {
					return target;
				} else if (originalItem == target) {
					return item;
				}

				return originalItem;
			});
		}
	}

	function handleMouseUp() {
		if ($draggedItem) {
			$draggedItem = null;
			dispatch('reorder');
		}
	}

	function handleMouseMove(ev: PointerEvent) {
		mousePosition = {
			x: ev.clientX,
			y: ev.clientY
		};
	}
</script>

<svelte:window on:mouseup={handleMouseUp} on:pointermove={handleMouseMove} />

{#each itemsPlus as entry, index (entry ? entry[0] : null)}
	<div in:fly|global={{ y: 30, delay: 200 + index * 50 }}>
		{#if entry}
			<Arrangable {index} state={entry[1]} {customDragHandling} on:drag={(ev) => onDrag(entry, ev)}>
				<slot item={entry[0]} dragController={entry[1].controller} this />
			</Arrangable>
		{:else}
			<slot name="plus" />
		{/if}
	</div>
{/each}

<style>
	div {
		display: flex;
		flex-direction: inherit;
	}
</style>
