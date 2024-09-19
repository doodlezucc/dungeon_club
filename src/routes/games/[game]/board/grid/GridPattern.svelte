<script lang="ts">
	import { HexGridSpace } from '$lib/packages/grid/spaces/hex';
	import type { GridSpace } from '$lib/packages/grid/spaces/interface';
	import { SquareGridSpace } from '$lib/packages/grid/spaces/square';
	import SvgHexagon from './SvgHexagon.svelte';

	export let id: string;
	export let gridSpace: GridSpace | null;

	export let cellWidth: number;
	$: cellHeight = cellWidth * (gridSpace?.tileHeightRatio ?? 1);
</script>

{#if gridSpace instanceof SquareGridSpace}
	<pattern {id} patternUnits="userSpaceOnUse" width="{cellWidth}px" height="{cellHeight}px">
		<rect width="100%" height="100%" />
	</pattern>
{:else if gridSpace instanceof HexGridSpace}
	{#if gridSpace.axis === 'horizontal'}
		<pattern {id} patternUnits="userSpaceOnUse" width="{cellWidth * 2}px" height="{cellHeight}px">
			<SvgHexagon offset={{ x: 0.5, y: 0.5 }} {cellWidth} {gridSpace} />
			<SvgHexagon offset={{ x: 1.5, y: 0 }} {cellWidth} {gridSpace} />
			<SvgHexagon offset={{ x: 1.5, y: 1 }} {cellWidth} {gridSpace} />
		</pattern>
	{:else}
		<pattern {id} patternUnits="userSpaceOnUse" width="{cellWidth}px" height="{cellHeight * 2}px">
			<SvgHexagon offset={{ x: 0.5, y: 0.5 }} {cellWidth} {gridSpace} />
			<SvgHexagon offset={{ x: 0, y: 1.5 }} {cellWidth} {gridSpace} />
			<SvgHexagon offset={{ x: 1, y: 1.5 }} {cellWidth} {gridSpace} />
		</pattern>
	{/if}
{/if}
