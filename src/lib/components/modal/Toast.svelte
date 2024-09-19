<script lang="ts" context="module">
	export const MAX_TOAST_COUNT = 3;
	export const TOAST_DURATION_MS = 3000;

	export interface ToastOptions {
		text: string;
		icon?: IconID;
	}
</script>

<script lang="ts">
	import Icon, { type IconID } from 'components/Icon.svelte';
	import Separator from 'components/layout/Separator.svelte';
	import Text from '../Text.svelte';

	export let options: ToastOptions;
	export let isLatest: boolean;
</script>

<div class="toast" class:latest={isLatest}>
	{#if options.icon}
		<Icon icon={options.icon} />
		<Separator />
	{/if}
	<Text>{options.text}</Text>
</div>

<style>
	.toast {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 1em;
		border-radius: 50px;
		padding: 1em 1.5em;
		box-sizing: border-box;
		background-color: var(--color-container);
		opacity: 1;
	}

	.toast:not(.latest) {
		opacity: 0.4;
		transition-duration: 0.1s;
	}

	:global(.toast > *) {
		margin: 0;
	}

	:global(.toast > .separator) {
		height: 1em;
	}
</style>
