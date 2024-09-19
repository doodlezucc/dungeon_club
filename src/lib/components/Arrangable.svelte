<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { spring } from 'svelte/motion';
	import type { DragState } from './ArrangedCollection.svelte';
	import type { Position } from './compounds';

	export let index: number;
	export let state: DragState;
	export let customDragHandling: boolean;

	let isDragging = state.controller.isDragging;
	let isAnyDragging = state.isAnyDragging;

	$: mouseOffset = undefined as Position | undefined;

	let visualCenter = spring<Position>(undefined, {
		stiffness: 0.1,
		damping: 0.4
	});

	let center: Position | undefined = undefined;
	let draggedCenter: Position | undefined = undefined;

	let container: HTMLElement;

	$: if (!$isDragging) {
		mouseOffset = undefined;
		draggedCenter = center;
	}

	function findCenter() {
		const rect = container.getBoundingClientRect();
		center = {
			x: rect.left + rect.width / 2,
			y: rect.top + rect.height / 2
		};
		if (!$isDragging) {
			$visualCenter = center;
		}
		state.setItemCenter(center);
	}

	$: {
		if (container && $isAnyDragging && index !== undefined) {
			findCenter();
		}
	}

	$: visualOffset =
		$visualCenter && center
			? {
					x: $visualCenter.x - center!.x,
					y: $visualCenter.y - center!.y
				}
			: { x: 0, y: 0 };

	const dispatch = createEventDispatcher();

	$: {
		if (draggedCenter) {
			dispatch('drag');
			$visualCenter = draggedCenter;
		}
	}

	function handleMouseMove(ev: PointerEvent) {
		mouseOffset ??= {
			x: ev.clientX - center!.x,
			y: ev.clientY - center!.y
		};

		draggedCenter = {
			x: ev.clientX - mouseOffset.x,
			y: ev.clientY - mouseOffset.y
		};
	}

	function onDragContainer(ev: DragEvent) {
		ev.preventDefault();

		if (!customDragHandling) {
			state.controller.start();
		}
	}
</script>

<svelte:window on:pointermove={$isDragging ? handleMouseMove : undefined} />

<div
	class="arrangable"
	class:dragging={$isDragging}
	role="listitem"
	draggable="true"
	on:dragstart={onDragContainer}
>
	<div class="expand ghost" bind:this={container}></div>
	<div class="expand" style="translate: {visualOffset.x}px {visualOffset.y}px;">
		<slot />
	</div>
</div>

<style>
	.arrangable {
		position: relative;
	}

	.expand {
		display: flex;
		width: 100%;
		height: 100%;
	}

	.ghost {
		position: absolute;
		outline: 1px solid transparent;
	}

	.dragging * {
		pointer-events: none;
	}

	.dragging .ghost {
		outline: 2px dashed white;
	}
</style>
