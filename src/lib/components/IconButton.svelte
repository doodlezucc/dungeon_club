<script lang="ts">
	import type { IconID } from './Icon.svelte';
	import Icon from './Icon.svelte';

	export let icon: IconID;
	export let label: string;
	export let disabled: boolean = false;
	export let disableMargin: boolean = false;
	export let inline: boolean = false;
</script>

<button
	on:click
	class="icon"
	class:disable-margin={disableMargin}
	class:inline
	{disabled}
	aria-label={label}
>
	<Icon {icon} />
</button>

<style>
	button:not(:hover, :active) {
		color: inherit;
	}
</style>
