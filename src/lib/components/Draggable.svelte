<script lang="ts" context="module">
	import type { Action } from 'svelte/action';
	import type { Position } from './compounds';

	export interface DraggableParams {
		autoDrag?: boolean;

		/** Defaults to `window`. */
		mouseUpEventListener?: EventTarget;

		handleDragging: (ev: MouseEvent) => void;
		onDragToggle?: (isDragging: boolean) => void;
		onDragStart?: (ev: DragEvent) => void;
	}

	export const draggable: Action<HTMLElement, DraggableParams> = (node, params) => {
		const autoDrag = params.autoDrag ?? false;
		const mouseUpEventListener = params.mouseUpEventListener ?? window;

		node.draggable = true;

		function handleGlobalMouseMove(ev: MouseEvent) {
			params.handleDragging(ev);
		}

		function handleDragStart(ev?: DragEvent) {
			if (ev) {
				ev.preventDefault();
				if (params.onDragStart) params.onDragStart(ev);
			}

			if (params.onDragToggle) params.onDragToggle(true);

			window.addEventListener('mousemove', handleGlobalMouseMove);
			mouseUpEventListener.addEventListener('mouseup', handleGlobalMouseUp);
		}

		function handleGlobalMouseUp() {
			if (params.onDragToggle) params.onDragToggle(false);

			window.removeEventListener('mousemove', handleGlobalMouseMove);
			mouseUpEventListener.removeEventListener('mouseup', handleGlobalMouseUp);
		}

		node.addEventListener('dragstart', handleDragStart);
		if (autoDrag) {
			handleDragStart();
		}

		return {
			destroy: () => {
				node.removeEventListener('dragstart', handleDragStart);
				window.removeEventListener('mousemove', handleGlobalMouseMove);
				mouseUpEventListener.removeEventListener('mouseup', handleGlobalMouseUp);
			}
		};
	};
</script>

<script lang="ts">
	import { spring } from 'svelte/motion';

	export let offset: Position = {
		x: 0,
		y: 0
	};

	let visualOffset = spring<Position>(offset, {
		stiffness: 0.1,
		damping: 0.4
	});
</script>

<div
	role="presentation"
	style="translate: {$visualOffset.x}px {$visualOffset.y}px;"
	use:draggable={{
		handleDragging: (ev) =>
			(offset = {
				x: offset.x + ev.movementX,
				y: offset.y + ev.movementY
			})
	}}
>
	<slot />
</div>
