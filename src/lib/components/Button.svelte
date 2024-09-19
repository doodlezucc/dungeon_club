<script lang="ts">
	import { goto } from '$app/navigation';

	export let href: string | undefined = undefined;

	export let highlight: boolean = false;
	export let raised: boolean = false;

	export let disabled: boolean = false;
	export let type: HTMLButtonElement['type'] | undefined = undefined;

	function handleSpaceBar(ev: KeyboardEvent) {
		if (ev.key === ' ') {
			goto(href!);
		}
	}
</script>

<svelte:element
	this={href ? 'a' : 'button'}
	on:click
	on:keypress={href ? handleSpaceBar : undefined}
	{href}
	role={href && 'button'}
	class:action={highlight}
	class:raised
	{disabled}
	{type}
>
	<slot />
</svelte:element>
