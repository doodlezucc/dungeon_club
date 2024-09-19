<script lang="ts" context="module">
	const PLUS_ITEM_TOKEN = {};
</script>

<script lang="ts" generics="T">
	import { flip } from 'svelte/animate';
	import { fly } from 'svelte/transition';

	function identity<T>(x: T) {
		return x;
	}

	export let items: Array<T>;
	export let itemClass: string | undefined = undefined;
	export let keyFunction: (item: T) => unknown = identity;

	function keyOf(itemOrPlus: T) {
		if (itemOrPlus === PLUS_ITEM_TOKEN) {
			return PLUS_ITEM_TOKEN;
		}

		return keyFunction(itemOrPlus);
	}

	$: modifiedItems = [...items, PLUS_ITEM_TOKEN] as Array<T>;
</script>

{#each modifiedItems as item, index (keyOf(item))}
	<div
		class={item !== PLUS_ITEM_TOKEN ? itemClass : undefined}
		animate:flip={{ duration: 200 }}
		in:fly|global={{ y: 30, delay: 200 + index * 50 }}
	>
		{#if item !== PLUS_ITEM_TOKEN}
			<slot {item} />
		{:else}
			<slot name="plus" />
		{/if}
	</div>
{/each}

<style>
	div {
		display: flex;
		flex-direction: inherit;
	}
</style>
