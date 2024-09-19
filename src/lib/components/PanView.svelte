<script lang="ts" context="module">
	import type { Position, Size } from '$lib/compounds';
	import { createEventDispatcher } from 'svelte';

	const minZoom = -1;
	const maxZoom = 3;
	const zoomStep = 0.25;

	function clampToBounds(position: Position, dimensions: Size) {
		const maxX = dimensions.width / 2;
		const maxY = dimensions.height / 2;
		const minX = -maxX;
		const minY = -maxY;

		let { x, y } = position;

		if (x < minX) x = minX;
		else if (x > maxX) x = maxX;

		if (y < minY) y = minY;
		else if (y > maxY) y = maxY;

		return { x, y };
	}

	function clampZoom(zoom: number) {
		return Math.min(Math.max(zoom, minZoom), maxZoom);
	}
</script>

<script lang="ts">
	export let expand = false;

	export let position = { x: 0, y: 0 };
	export let zoom = 0;

	export let elementView: HTMLElement | undefined = undefined;
	export let elementContent: HTMLElement | undefined = undefined;

	$: elementsTriggeringPanEvent = [elementView, elementContent] as EventTarget[];

	$: isPanning = false;
	$: hasPointerMovedSincePanStart = false;
	$: pointerOrigin = { x: 0, y: 0 };

	$: scale = Math.exp(zoom);

	let dimensions = {
		width: 1,
		height: 1
	};

	const dispatch = createEventDispatcher<{
		click: void;
	}>();

	function isValidPanEventStarter(eventTarget: EventTarget | null) {
		return eventTarget && elementsTriggeringPanEvent.includes(eventTarget);
	}

	function startPanning(ev: PointerEvent) {
		if (!isPanning) {
			const isMainMouseButton = ev.button == 0;

			if (!isMainMouseButton || isValidPanEventStarter(ev.target)) {
				ev.preventDefault();
				pointerOrigin = { x: ev.screenX, y: ev.screenY };
				isPanning = true;
				hasPointerMovedSincePanStart = false;
			}
		}
	}

	function stopPanning() {
		if (isPanning) {
			if (!hasPointerMovedSincePanStart) {
				dispatch('click');
			}

			isPanning = false;
		}
	}

	function handlePointerMove(ev: PointerEvent) {
		if (!isPanning) return;

		hasPointerMovedSincePanStart = true;

		const offset = {
			x: (ev.screenX - pointerOrigin.x) / scale,
			y: (ev.screenY - pointerOrigin.y) / scale
		};

		position = clampToBounds(
			{
				x: position.x + offset.x,
				y: position.y + offset.y
			},
			dimensions
		);
		pointerOrigin = {
			x: ev.screenX,
			y: ev.screenY
		};
	}

	function handleMouseWheel(ev: WheelEvent) {
		const clamp = 0.1;
		const delta = ev.deltaY;
		const sign = delta >= 0 ? 1 : -1;

		const deltaClamped = sign * Math.min(Math.abs(delta), clamp);
		const deltaNormalized = deltaClamped / clamp;

		zoom = clampZoom(zoom - zoomStep * deltaNormalized);
	}
</script>

<svelte:document on:pointermove={handlePointerMove} on:pointerup={stopPanning} />

<div
	bind:this={elementView}
	class="pan-view"
	class:expand
	on:pointerdown={startPanning}
	on:wheel={handleMouseWheel}
	style="--x: {position.x}; --y: {position.y}; --scale: {scale};"
>
	<div
		bind:this={elementContent}
		class="panned"
		bind:clientWidth={dimensions.width}
		bind:clientHeight={dimensions.height}
	>
		<slot />
	</div>
</div>

<style>
	.pan-view {
		position: relative;
		display: flex;

		justify-content: center;
		overflow: hidden;
	}

	.panned {
		display: flex;
		align-self: center;

		transform: translate(calc(var(--x) * 1px), calc(var(--y) * 1px));
		scale: var(--scale);
		transition: scale 0.08s;
	}
</style>
