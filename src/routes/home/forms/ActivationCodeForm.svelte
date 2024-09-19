<script lang="ts">
	import { focusOnMount } from 'components/Input.svelte';
	import Form from './Form.svelte';

	export let title: string;
	export let submitButtonLabel = 'Verify';

	export let handleCodeSubmit: (enteredCode: string) => Promise<void>;

	$: enteredCode = '';
</script>

<Form
	{title}
	{submitButtonLabel}
	disableFormSpacing
	handleSubmit={() => handleCodeSubmit(enteredCode)}
>
	<p slot="note">
		<slot name="note" />
	</p>

	<input name="activation-code" placeholder="CODE" bind:value={enteredCode} use:focusOnMount />
</Form>

<style>
	p {
		text-align: center;
		color: var(--color-text-pale);
		max-width: 20em;
	}

	input {
		min-width: 7em;
		width: 7em;
		text-align: center;
		font-size: 1.5em;
	}
</style>
