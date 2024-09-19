<script lang="ts">
	import { Button } from 'components';

	export let name: string;
</script>

<Button on:click>{name}</Button>
