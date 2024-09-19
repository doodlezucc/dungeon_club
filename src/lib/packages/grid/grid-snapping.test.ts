import type { Position } from 'components/compounds';
import { describe, expect, test } from 'vitest';
import { HexGridSpace } from './spaces/hex';
import type { PositionedSquare } from './spaces/interface';
import { SquareGridSpace } from './spaces/square';

function expectApproximatePosition(received: Position, expected: Position) {
	return expect(received).toEqual({
		x: expect.closeTo(expected.x),
		y: expect.closeTo(expected.y)
	});
}

describe('Square Grid', () => {
	const gridSpace = new SquareGridSpace();

	test('Snap token of size 1 or 3', () => {
		function expectSnapped(raw: Position, expected: Position) {
			expectApproximatePosition(gridSpace.snapShapeToGrid({ size: 1, center: raw }), expected);
			expectApproximatePosition(gridSpace.snapShapeToGrid({ size: 3, center: raw }), expected);
		}

		expectSnapped({ x: 0.1, y: 0.1 }, { x: 0.5, y: 0.5 });
		expectSnapped({ x: 0.1, y: -0.1 }, { x: 0.5, y: -0.5 });
		expectSnapped({ x: 2.5, y: 3.5 }, { x: 2.5, y: 3.5 });
		expectSnapped({ x: -1.9, y: 3.9 }, { x: -1.5, y: 3.5 });
		expectSnapped({ x: 2.1, y: -4.1 }, { x: 2.5, y: -4.5 });
	});

	test('Snap token of size 0, 2 or 4', () => {
		function expectSnapped(raw: Position, expected: Position) {
			expectApproximatePosition(gridSpace.snapShapeToGrid({ size: 0, center: raw }), expected);
			expectApproximatePosition(gridSpace.snapShapeToGrid({ size: 2, center: raw }), expected);
			expectApproximatePosition(gridSpace.snapShapeToGrid({ size: 4, center: raw }), expected);
		}

		expectSnapped({ x: 0.1, y: 0.1 }, { x: 0, y: 0 });
		expectSnapped({ x: 0.1, y: -0.1 }, { x: 0, y: 0 });
		expectSnapped({ x: 2.4, y: 3.4 }, { x: 2, y: 3 });
		expectSnapped({ x: -1.9, y: 3.9 }, { x: -2, y: 4 });
		expectSnapped({ x: 2.1, y: -4.1 }, { x: 2, y: -4 });
	});
});

describe('Hex Grid', () => {
	const gridSpaceHorizontal = new HexGridSpace('horizontal');
	const gridSpaceVertical = new HexGridSpace('vertical');

	function expectApproximate(token: PositionedSquare, expectedUnstretched: Position) {
		expectApproximatePosition(gridSpaceHorizontal.snapShapeToGrid(token), {
			x: expectedUnstretched.x,
			y: expectedUnstretched.y * gridSpaceHorizontal.tileHeightRatio
		});

		const rotated: PositionedSquare = {
			center: {
				x: token.center.y,
				y: token.center.x
			},
			size: token.size
		};

		expectApproximatePosition(gridSpaceVertical.snapShapeToGrid(rotated), {
			x: expectedUnstretched.y,
			y: expectedUnstretched.x * gridSpaceVertical.tileHeightRatio
		});
	}

	test('Snap token of size 1 or 3', () => {
		function expectSnapped(raw: Position, expected: Position) {
			expectApproximate({ size: 1, center: raw }, expected);
			expectApproximate({ size: 3, center: raw }, expected);
		}

		/**
		 * 0___1___2____   0___1___2___
		 * |   \___/   \   |   | _ |
		 * 1___/   \___/   1___|___|___
		 * |   \___/   \   |   | _ |
		 * 2___/   \___/   2___|___|___
		 * |   \___/   \   |   | _ |
		 * 3___/   \___/   3___|___|___
		 * |   \___/       |   | _ |
		 * |               |   |   |
		 */

		expectSnapped({ x: 0.1, y: 0.1 }, { x: 0.5, y: 0.5 });
		expectSnapped({ x: 0.1, y: -0.1 }, { x: 0.5, y: -0.5 });
		expectSnapped({ x: 1.1, y: -0.1 }, { x: 1.5, y: 0 });
		expectSnapped({ x: 2.5, y: 3.5 }, { x: 2.5, y: 3.5 });
		expectSnapped({ x: -1.9, y: 3.9 }, { x: -1.5, y: 3.5 });
		expectSnapped({ x: -2.1, y: 3.9 }, { x: -2.5, y: 4 });
		expectSnapped({ x: 2.1, y: -4.1 }, { x: 2.5, y: -4.5 });
	});

	describe('Snap token of size 0, 2 or 4', () => {
		function expectSnapped(raw: Position, expected: Position) {
			test('Snap ' + JSON.stringify(raw) + ' to intersection', () => {
				expectApproximate({ size: 0, center: raw }, expected);
				expectApproximate({ size: 2, center: raw }, expected);
				expectApproximate({ size: 4, center: raw }, expected);
			});
		}

		const oneSixth = 1 / 6;

		/**
		 * 0___1___2____   0___1___2___
		 * |   \___/   \   |   | _ |
		 * 1___/   \___/   1___|___|___
		 * |   \___/   \   |   | _ |
		 * 2___/   \___/   2___|___|___
		 * |   \___/   \   |   | _ |
		 * 3___/   \___/   3___|___|___
		 * |   \___/       |   | _ |
		 * |               |   |   |
		 */

		expectSnapped({ x: 0.1, y: 0.1 }, { x: oneSixth, y: 0 });
		expectSnapped({ x: 0.1, y: -0.1 }, { x: oneSixth, y: 0 });
		expectSnapped({ x: 1.1, y: -0.1 }, { x: 1 - oneSixth, y: 0 });
		expectSnapped({ x: 2.4, y: 3.8 }, { x: 2 + oneSixth, y: 4 });
		expectSnapped({ x: -1.9, y: 3.9 }, { x: -2 + oneSixth, y: 4 });
		expectSnapped({ x: -2.1, y: 3.9 }, { x: -2 + oneSixth, y: 4 });
		expectSnapped({ x: 2.1, y: -4.1 }, { x: 2 + oneSixth, y: -4 });
	});
});
