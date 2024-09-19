<script lang="ts" context="module">
	export function focusOnMount(node: HTMLInputElement, enabled: boolean = true) {
		if (enabled) {
			node.focus();
		}
	}
</script>

<script lang="ts">
	import type { HTMLInputTypeAttribute } from 'svelte/elements';

	export let value: string | number;

	export let name: string;
	export let label: string | undefined = undefined;
	export let id: string | undefined = undefined;

	export let placeholder: string;

	export let type: HTMLInputTypeAttribute | undefined = undefined;
	export let required: boolean | undefined = undefined;
	export let autocomplete: 'email' | 'current-password' | 'new-password' | undefined = undefined;
	export let autofocus: boolean = false;

	export let size: 'small' | undefined = undefined;

	function applyType(node: HTMLInputElement) {
		if (type !== undefined) {
			node.type = type;
		}

		if (autofocus) {
			node.focus();
		}
	}

	// "const" -> Only updated on mount
	const isNumericInput = typeof value === 'number';

	let valueAsString = `${value}`;
	$: {
		if (isNumericInput) {
			value = parseFloat(valueAsString);
		} else {
			value = valueAsString;
		}
	}
</script>

{#if label}
	<label>
		{label}

		<input
			{id}
			{name}
			{placeholder}
			{autocomplete}
			tabindex={autofocus ? 0 : undefined}
			{required}
			aria-required={required}
			data-size={size}
			bind:value={valueAsString}
			use:applyType
			use:focusOnMount={autofocus}
		/>
	</label>
{:else}
	<input
		{id}
		{name}
		{placeholder}
		{autocomplete}
		tabindex={autofocus ? 0 : undefined}
		{required}
		aria-required={required}
		data-size={size}
		bind:value={valueAsString}
		use:applyType
		use:focusOnMount={autofocus}
	/>
{/if}

<style>
	label {
		text-align: start;
		display: grid;
		gap: 0.25em;
	}

	input[data-size='small'] {
		min-width: 0;
	}
</style>
