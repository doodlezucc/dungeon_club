import type { Position } from 'components/compounds';
import type { HexagonAxis } from './hex';

export interface UnitHexagon {
	points: Position[];
}

export const oneThird = 1 / 3;

export const unitHexagons: Record<HexagonAxis, UnitHexagon> = {
	horizontal: {
		points: [
			{ x: -oneThird, y: -0.5 },
			{ x: oneThird, y: -0.5 },
			{ x: 2 * oneThird, y: 0 },
			{ x: oneThird, y: 0.5 },
			{ x: -oneThird, y: 0.5 },
			{ x: -2 * oneThird, y: 0 }
		]
	},
	vertical: {
		points: [
			{ x: -0.5, y: oneThird },
			{ x: -0.5, y: -oneThird },
			{ x: 0, y: -2 * oneThird },
			{ x: 0.5, y: -oneThird },
			{ x: 0.5, y: oneThird },
			{ x: 0, y: 2 * oneThird }
		]
	}
};
