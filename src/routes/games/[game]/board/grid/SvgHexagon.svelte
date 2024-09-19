<script lang="ts" context="module">
	import type { HexGridSpace } from '$lib/packages/grid/spaces/hex';
	import type { Position } from 'components/compounds';

	function drawPolygon(offset: Position, scale: number, gridSpace: HexGridSpace): Position[] {
		const unitHexagon = gridSpace.getUnitHexagonShape();

		return unitHexagon.points.map((point) => ({
			x: (point.x + offset.x) * scale,
			y: (point.y + offset.y) * scale * gridSpace.tileHeightRatio
		}));
	}

	function makePolygonData(points: Position[]) {
		return points.map((point) => `${point.x},${point.y}`).join(' ');
	}
</script>

<script lang="ts">
	export let offset: Position;
	export let cellWidth: number;
	export let gridSpace: HexGridSpace;

	$: points = drawPolygon(offset, cellWidth, gridSpace);
</script>

<polygon id="hexagon" points={makePolygonData(points)} />
