import type { Position } from '$lib/compounds';

export type PositionedSquare = {
	center: Position;
	size: number;
};

export abstract class GridSpace {
	abstract get tileHeightRatio(): number;
	protected abstract snapShapeToGridUnstretched(token: PositionedSquare): Position;

	snapShapeToGrid(token: PositionedSquare): Position {
		const unstretched = this.snapShapeToGridUnstretched(token);
		return {
			x: unstretched.x,
			y: unstretched.y * this.tileHeightRatio
		};
	}
}
