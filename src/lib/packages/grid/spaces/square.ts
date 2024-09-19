import type { Position } from '$lib/compounds';
import { GridSpace, type PositionedSquare } from './interface';

export class SquareGridSpace extends GridSpace {
	static readonly instance = new SquareGridSpace();

	protected snapShapeToGridUnstretched({ center: { x, y }, size }: PositionedSquare): Position {
		if (size % 2 == 1) {
			// Sizes 1, 3, 5 are centered in the middle of a grid cell
			return {
				x: Math.floor(x) + 0.5,
				y: Math.floor(y) + 0.5
			};
		} else {
			// Sizes 2, 4, 6 are centered on an intersection of grid cells
			return {
				x: Math.round(x),
				y: Math.round(y)
			};
		}
	}

	get tileHeightRatio(): number {
		return 1;
	}
}
