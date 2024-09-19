import { get } from 'svelte/store';
import { expect, test } from 'vitest';
import type { BidirectionalAction } from './action';
import { createHistory, type HistoryState } from './history';

test('Undo/Redo has no effect when history is empty', async () => {
	const history = createHistory();

	expect(get(history)).toEqual(<HistoryState>{
		presentIndex: 0,
		timeline: []
	});

	await history.undo();

	expect(get(history)).toEqual(<HistoryState>{
		presentIndex: 0,
		timeline: []
	});

	await history.redo();

	expect(get(history)).toEqual(<HistoryState>{
		presentIndex: 0,
		timeline: []
	});
});

test('Undo/Redo synchronous action', async () => {
	let counterVariable = 0;

	const history = createHistory();

	const increaseFrom0To1 = <BidirectionalAction>{
		name: 'Increase counter from 0 to 1',
		do: () => {
			counterVariable++;
		},
		undo: () => {
			counterVariable--;
		}

		// RECOMMENDED constant actions:

		// do: () => {
		// 	counterVariable = 1;
		// },
		// undo: () => {
		// 	counterVariable = 0;
		// }
	};

	history.register(increaseFrom0To1);
	expect(counterVariable).toBe(1);
	expect(get(history)).toEqual(<HistoryState>{
		presentIndex: 1,
		timeline: [increaseFrom0To1]
	});

	await history.redo();
	expect(counterVariable).toBe(1);
	expect(get(history)).toEqual(<HistoryState>{
		presentIndex: 1,
		timeline: [increaseFrom0To1]
	});

	await history.undo();
	expect(counterVariable).toBe(0);
	expect(get(history)).toEqual(<HistoryState>{
		presentIndex: 0,
		timeline: [increaseFrom0To1]
	});
	await history.undo();
	expect(counterVariable).toBe(0);
	expect(get(history)).toEqual(<HistoryState>{
		presentIndex: 0,
		timeline: [increaseFrom0To1]
	});

	const increaseFrom0To2 = <BidirectionalAction>{
		name: 'Increase counter from 0 to 2',
		do: () => {
			counterVariable = 2;
		},
		undo: () => {
			counterVariable = 0;
		}
	};

	history.register(increaseFrom0To2);
	expect(counterVariable).toBe(2);
	expect(get(history)).toEqual(<HistoryState>{
		presentIndex: 1,
		timeline: [increaseFrom0To2]
	});
});

test('Undo/Redo asynchronous action', async () => {
	let counterVariable = 0;

	async function setCounterAsync(value: number) {
		await new Promise((resolve) => setTimeout(resolve, 100));
		counterVariable = value;
	}

	const history = createHistory();

	async function undoAndWait() {
		await (
			await history.undo()
		)?.completed;
	}

	async function redoAndWait() {
		await (
			await history.redo()
		)?.completed;
	}

	const increaseFrom0To1 = {
		name: 'Increase counter from 0 to 1',
		do: () => setCounterAsync(1),
		undo: () => setCounterAsync(0)
	};

	await history.register(increaseFrom0To1);
	expect(counterVariable).toBe(1);
	expect(get(history)).toEqual(<HistoryState>{
		presentIndex: 1,
		timeline: [increaseFrom0To1]
	});

	await redoAndWait();
	expect(counterVariable).toBe(1);
	expect(get(history)).toEqual(<HistoryState>{
		presentIndex: 1,
		timeline: [increaseFrom0To1]
	});

	await undoAndWait();
	expect(counterVariable).toBe(0);
	expect(get(history)).toEqual(<HistoryState>{
		presentIndex: 0,
		timeline: [increaseFrom0To1]
	});
	await undoAndWait();
	expect(counterVariable).toBe(0);
	expect(get(history)).toEqual(<HistoryState>{
		presentIndex: 0,
		timeline: [increaseFrom0To1]
	});

	const increaseFrom0To2 = {
		name: 'Increase counter from 0 to 2',
		do: () => setCounterAsync(2),
		undo: () => setCounterAsync(0)
	};

	await history.register(increaseFrom0To2);
	expect(counterVariable).toBe(2);
	expect(get(history)).toEqual(<HistoryState>{
		presentIndex: 1,
		timeline: [increaseFrom0To2]
	});
});

test('Undo/Redo multiple', async () => {
	let counterVariable = 0;

	const history = createHistory();

	const increaseFrom0To1 = <BidirectionalAction>{
		name: 'Increase counter from 0 to 1',
		do: () => {
			counterVariable = 1;
		},
		undo: () => {
			counterVariable = 0;
		}
	};

	const increaseFrom1To2 = <BidirectionalAction>{
		name: 'Increase counter from 1 to 2',
		do: () => {
			counterVariable = 2;
		},
		undo: () => {
			counterVariable = 1;
		}
	};

	history.register(increaseFrom0To1);
	history.register(increaseFrom1To2);
	expect(counterVariable).toBe(2);
	expect(get(history)).toEqual(<HistoryState>{
		presentIndex: 2,
		timeline: [increaseFrom0To1, increaseFrom1To2]
	});

	await history.redo();
	expect(counterVariable).toBe(2);
	expect(get(history)).toEqual(<HistoryState>{
		presentIndex: 2,
		timeline: [increaseFrom0To1, increaseFrom1To2]
	});

	await history.undo();
	expect(counterVariable).toBe(1);
	expect(get(history)).toEqual(<HistoryState>{
		presentIndex: 1,
		timeline: [increaseFrom0To1, increaseFrom1To2]
	});
	await history.undo();
	expect(counterVariable).toBe(0);
	expect(get(history)).toEqual(<HistoryState>{
		presentIndex: 0,
		timeline: [increaseFrom0To1, increaseFrom1To2]
	});

	await history.redo();
	expect(counterVariable).toBe(1);
	expect(get(history)).toEqual(<HistoryState>{
		presentIndex: 1,
		timeline: [increaseFrom0To1, increaseFrom1To2]
	});
	await history.redo();
	expect(counterVariable).toBe(2);
	expect(get(history)).toEqual(<HistoryState>{
		presentIndex: 2,
		timeline: [increaseFrom0To1, increaseFrom1To2]
	});

	await history.undo();
	expect(counterVariable).toBe(1);
	expect(get(history)).toEqual(<HistoryState>{
		presentIndex: 1,
		timeline: [increaseFrom0To1, increaseFrom1To2]
	});

	const increaseFrom1To3 = <BidirectionalAction>{
		name: 'Increase counter from 1 to 3',
		do: () => {
			counterVariable = 3;
		},
		undo: () => {
			counterVariable = 1;
		}
	};

	history.register(increaseFrom1To3);
	expect(counterVariable).toBe(3);
	expect(get(history)).toEqual(<HistoryState>{
		presentIndex: 2,
		timeline: [increaseFrom0To1, increaseFrom1To3]
	});

	await history.undo();
	expect(counterVariable).toBe(1);
	expect(get(history)).toEqual(<HistoryState>{
		presentIndex: 1,
		timeline: [increaseFrom0To1, increaseFrom1To3]
	});

	await history.undo();
	expect(counterVariable).toBe(0);
	expect(get(history)).toEqual(<HistoryState>{
		presentIndex: 0,
		timeline: [increaseFrom0To1, increaseFrom1To3]
	});

	await history.redo();
	expect(counterVariable).toBe(1);
	expect(get(history)).toEqual(<HistoryState>{
		presentIndex: 1,
		timeline: [increaseFrom0To1, increaseFrom1To3]
	});

	await history.redo();
	expect(counterVariable).toBe(3);
	expect(get(history)).toEqual(<HistoryState>{
		presentIndex: 2,
		timeline: [increaseFrom0To1, increaseFrom1To3]
	});

	await history.redo();
	expect(counterVariable).toBe(3);
	expect(get(history)).toEqual(<HistoryState>{
		presentIndex: 2,
		timeline: [increaseFrom0To1, increaseFrom1To3]
	});
});

test('Undo/Redo with inline syntax', async () => {
	let counterVariable = 0;

	const history = createHistory();

	await history.registerUndoable('Increase counter from 0 to 1', () => {
		counterVariable = 1;

		return {
			undo: () => {
				counterVariable = 0;
			}
		};
	});

	expect(counterVariable).toBe(1);

	await history.registerUndoable('Increase counter from 1 to 2', () => {
		counterVariable = 2;

		return {
			undo: () => {
				counterVariable = 1;
			}
		};
	});
	expect(counterVariable).toBe(2);

	await history.undo();
	expect(counterVariable).toBe(1);

	await history.undo();
	expect(counterVariable).toBe(0);

	await history.undo();
	expect(counterVariable).toBe(0);

	await history.redo();
	expect(counterVariable).toBe(1);

	await history.redo();
	expect(counterVariable).toBe(2);

	await history.undo();
	expect(counterVariable).toBe(1);
});
