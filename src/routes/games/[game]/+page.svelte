<script lang="ts">
	import { onMount } from 'svelte';

	import { page } from '$app/stores';
	import { Campaign } from 'client/state';
	import { Row } from 'components/layout';
	import BoardView from './BoardView.svelte';
	import Sidebar from './Sidebar.svelte';

	onMount(async () => {
		await Campaign.instance.join({ id: $page.params.game });
	});
</script>

<main class="column expand">
	<Row expand>
		<BoardView />
		<Sidebar />
	</Row>
</main>

<style>
	main {
		padding: 0;
	}
</style>
