import type { Position } from '$lib/compounds';
import { oneThird, unitHexagons, type UnitHexagon } from './hex-shape';
import { GridSpace, type PositionedSquare } from './interface';

type Vector = Position;
export type HexagonAxis = 'horizontal' | 'vertical';

/**
 * ```
 *      |
 *     _|_
 * ___/___\___ long axis
 *    \___/
 *      |
 *      |
 * short axis
 * ```
 */
interface FlatVector {
	longCoordinate: number;
	shortCoordinate: number;
}

const invertedSqrt3 = 0.5773502691896257; // 1 / √3

const tileHeights: Record<HexagonAxis, number> = {
	horizontal: 2 * invertedSqrt3, // 2 / √3
	vertical: 0.8660254037844386 //  √3 /  2
};

export class HexGridSpace extends GridSpace {
	static readonly horizontal = new HexGridSpace('horizontal');
	static readonly vertical = new HexGridSpace('vertical');

	constructor(readonly axis: HexagonAxis) {
		super();
	}

	get tileHeightRatio() {
		return tileHeights[this.axis];
	}

	getUnitHexagonShape(): UnitHexagon {
		return unitHexagons[this.axis];
	}

	private rotated(flat: FlatVector): Vector {
		if (this.axis === 'horizontal') {
			return {
				x: flat.longCoordinate,
				y: flat.shortCoordinate
			};
		} else {
			return {
				x: flat.shortCoordinate,
				y: flat.longCoordinate
			};
		}
	}

	private flat(vector: Vector): FlatVector {
		if (this.axis === 'horizontal') {
			return {
				longCoordinate: vector.x,
				shortCoordinate: vector.y
			};
		} else {
			return {
				longCoordinate: vector.y,
				shortCoordinate: vector.x
			};
		}
	}

	protected snapShapeToGridUnstretched({ center, size }: PositionedSquare): Vector {
		const flatCenter = this.flat(center);

		const snappedFlatCenter = flatSnapShapeToGrid(flatCenter, size);

		return this.rotated(snappedFlatCenter);
	}
}

function flatSnapShapeToGrid(shapeCenter: FlatVector, size: number): FlatVector {
	if (size % 2 == 1) {
		// Sizes 1, 3, 5 are centered in the middle of a grid cell

		return snapToCellCenter(shapeCenter);
	} else {
		// Sizes 2, 4, 6 are centered on an intersection of grid cells
		return snapToCellIntersection(shapeCenter);
	}
}

function snapToCellCenter({ longCoordinate, shortCoordinate }: FlatVector): FlatVector {
	const remainder = longCoordinate % 2.0;
	const nonNegativeRemainder = (remainder + 2) % 2.0;
	const useEvenCellPlacement = nonNegativeRemainder < 1.0;

	let crossAxis: number;
	if (useEvenCellPlacement) {
		crossAxis = Math.floor(shortCoordinate) + 0.5;
	} else {
		crossAxis = Math.round(shortCoordinate);
	}

	return {
		longCoordinate: Math.floor(longCoordinate) + 0.5,
		shortCoordinate: crossAxis
	};
}

function snapToCellIntersection(vector: FlatVector): FlatVector {
	const cellCenter = snapToCellCenter(vector);

	const offsetFromCenter: FlatVector = {
		longCoordinate: vector.longCoordinate - cellCenter.longCoordinate,
		shortCoordinate: vector.shortCoordinate - cellCenter.shortCoordinate
	};

	const angle =
		Math.atan2(offsetFromCenter.shortCoordinate, offsetFromCenter.longCoordinate) + Math.PI;

	const angleClamped = Math.round((angle * 3) / Math.PI) % 6;

	const intersectionOffset = getNearestIntersectionOffsetForAngle(angleClamped);
	return {
		longCoordinate: cellCenter.longCoordinate + intersectionOffset.longCoordinate,
		shortCoordinate: cellCenter.shortCoordinate + intersectionOffset.shortCoordinate
	};
}

/**
 * ```
 *|        1     2
 *|        _______
 *|       /_  |  _\
 *|  0   /  \_|_/  \   3
 *|      \ _/ | \_ /
 *|       \___|___/
 *|
 *|       5      4
 * ```
 */
function getNearestIntersectionOffsetForAngle(angleClamped: number): FlatVector {
	switch (angleClamped) {
		case 0:
			return { longCoordinate: -2 * oneThird, shortCoordinate: 0 };
		case 1:
			return { longCoordinate: -oneThird, shortCoordinate: -0.5 };
		case 2:
			return { longCoordinate: oneThird, shortCoordinate: -0.5 };
		case 3:
			return { longCoordinate: 2 * oneThird, shortCoordinate: 0 };
		case 4:
			return { longCoordinate: oneThird, shortCoordinate: 0.5 };
		case 5:
			return { longCoordinate: -oneThird, shortCoordinate: 0.5 };
	}
	throw new RangeError('Clamped angle must be in interval [0, 6).');
}
