import type { GridType } from '@prisma/client';
import { HexGridSpace } from './spaces/hex';
import type { GridSpace } from './spaces/interface';
import { SquareGridSpace } from './spaces/square';

export abstract class GridSpaces {
	static parse(gridType: GridType): GridSpace {
		switch (gridType) {
			case 'SQUARE':
				return SquareGridSpace.instance;
			case 'HEX_HORIZONTAL':
				return HexGridSpace.horizontal;
			case 'HEX_VERTICAL':
				return HexGridSpace.vertical;
		}

		throw `No grid space implementation for type ${gridType}`;
	}
}
