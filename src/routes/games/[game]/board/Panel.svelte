<script lang="ts">
	import Container from 'components/layout/Container.svelte';

	export let title: string;
</script>

<Container>
	<h3>{title}</h3>

	<slot />
</Container>

<style>
	h3 {
		margin-bottom: 0.5em;
	}
</style>
