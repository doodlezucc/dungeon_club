<script lang="ts">
	import { Board } from 'client/state';
	import type { Size } from 'components/compounds';
	import GridPattern from './GridPattern.svelte';

	export let dimensions: Size;
	export let cellsPerRow: number;

	const activeGridSpace = Board.instance.grid.gridSpace;

	$: cellWidth = dimensions.width / cellsPerRow;
</script>

<svg id="grid" width={dimensions.width} height={dimensions.height}>
	<defs>
		<GridPattern id="patternSquare" gridSpace={$activeGridSpace} {cellWidth} />
	</defs>

	<rect width="100%" height="100%" fill="url(#patternSquare)" />
</svg>

<style>
	:global(#grid pattern *) {
		stroke-width: 1px;
		stroke: white;
		fill: none;
	}
</style>
