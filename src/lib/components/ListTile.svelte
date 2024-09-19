<script lang="ts">
	export let selected: boolean = false;
</script>

<li class="list-tile" class:selected>
	<div role="button" class="custom" tabindex="0" on:keydown on:click on:mousedown>
		<slot />
	</div>
</li>

<style lang="scss">
	.list-tile {
		display: flex;
		background-color: var(--color-list-tile);
		min-height: 2rem;
		padding: 8px;

		&:hover {
			background-color: var(--color-list-tile-hover);
		}

		&.selected {
			background-color: var(--color-list-tile-selected);
		}
	}

	div {
		display: flex;
		cursor: default;
		flex: 1;
	}

	:global(.list-tile:not(:hover) button) {
		opacity: 0;
	}
</style>
