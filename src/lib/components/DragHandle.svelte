<script lang="ts">
	import type { DragController } from './ArrangedCollection.svelte';

	import Icon from './Icon.svelte';

	export let controller: DragController;
</script>

<button class="drag-handle" on:mousedown={controller.start} tabindex="-1">
	<Icon icon="grip-vertical" />
</button>

<style lang="scss">
	button.drag-handle {
		color: var(--color-text-pale);
		border: none;
		outline: none;
		background: none;
		padding: 0 0.3em;
		font-size: 1em;

		&:not(:disabled):hover {
			background: none;
		}

		&:hover {
			color: var(--color-text);
		}
	}
</style>
