<script lang="ts">
	import Flex, { type FlexAlign, type FlexJustify, type Gap } from './Flex.svelte';

	export let expand = false;
	export let wrap = false;
	export let gap: Gap | undefined = undefined;

	export let align: FlexAlign | undefined = undefined;
	export let justify: FlexJustify | undefined = undefined;
</script>

<Flex direction="column" {expand} {wrap} {gap} {align} {justify}><slot /></Flex>
