<script lang="ts">
	import IconButton from 'components/IconButton.svelte';
	import { Align, Stack } from 'components/layout';

	export let isInheriting: boolean;
	export let disableToggle: boolean = false;

	function toggle() {
		isInheriting = !isInheriting;
	}
</script>

<div class="property-container" class:is-inheriting={isInheriting}>
	<Stack>
		<slot />

		<Align alignment="right" margin="small">
			<span class:is-inheriting={isInheriting} class:disabled={disableToggle}>
				<IconButton
					icon={disableToggle ? 'link-slash' : isInheriting ? 'globe' : 'reply'}
					label={isInheriting ? 'Make unique' : 'Inherit from template'}
					disabled={disableToggle}
					disableMargin
					inline
					on:click={toggle}
				/>
			</span>
		</Align>
	</Stack>
</div>

<style>
	.property-container.is-inheriting {
		color: var(--color-primary);
	}

	.property-container:not(:hover) span,
	span.disabled {
		opacity: 0.7;
	}

	span {
		transition-duration: 0.2s;
	}

	span:not(.is-inheriting) {
		color: var(--color-text-pale);
	}
</style>
