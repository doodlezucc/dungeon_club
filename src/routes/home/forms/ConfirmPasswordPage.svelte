<script lang="ts">
	import { fly } from 'svelte/transition';

	export let showActivationCodeForm: boolean;
</script>

<main>
	{#if !showActivationCodeForm}
		<div out:fly={{ x: -100 }}>
			<slot name="credentials-form" />
		</div>
	{:else}
		<div in:fly={{ x: 100, delay: 400 }}>
			<slot name="code-form" />
		</div>
	{/if}
</main>

<style>
	main {
		display: grid;
		justify-items: center;
	}

	main > div {
		position: absolute;
	}
</style>
