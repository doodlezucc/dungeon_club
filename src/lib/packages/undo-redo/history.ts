import { writable, type Invalidator, type Subscriber, type Unsubscriber } from 'svelte/store';
import type {
	BidirectionalAction,
	DeltaOptions,
	DirectionalFunction,
	PromiseOr,
	UndoableFn
} from './action';

const histories = new Map<unknown, HistoryStore>();

export function historyOf(key: unknown): HistoryStore {
	if (!histories.has(key)) {
		histories.set(key, createHistory());
	}

	return histories.get(key)!;
}

export interface HistoryState {
	timeline: BidirectionalAction[];

	/**
	 * Every action up to (including) this index is completed (can only be undone).
	 *
	 * Actions with an `index > presentIndex` are set in the future (can only be redone).
	 */
	presentIndex: number;
}

interface HistoryManipulationResult {
	actionName: string;
	completed: Promise<void>;
}

export interface HistoryStore {
	subscribe: (
		run: Subscriber<HistoryState>,
		invalidate?: Invalidator<HistoryState> | undefined
	) => Unsubscriber;

	register: (action: BidirectionalAction) => Promise<void>;
	registerUndoable: (name: string, doAction: UndoableFn) => Promise<void>;

	registerDelta: <T>(name: string, options: DeltaOptions<T>) => Promise<void>;
	registerDirectional: (name: string, doAction: DirectionalFunction) => Promise<void>;

	undo: () => Promise<HistoryManipulationResult | null>;
	redo: () => Promise<HistoryManipulationResult | null>;
}

export const createHistory = (): HistoryStore => {
	const { subscribe, update } = writable<HistoryState>({
		timeline: [],
		presentIndex: 0
	});

	let activePromise: Promise<unknown> | null = null;

	async function enqueuePromise<T>(promise: () => PromiseOr<T>): Promise<T> {
		const endOfQueue = (result: T) => {
			activePromise = null;
			return result;
		};

		if (activePromise) {
			const onAllCompleted = activePromise.then(promise).then(endOfQueue);
			activePromise = onAllCompleted;
			return await onAllCompleted;
		} else {
			const promiseResult = promise();
			if (promiseResult instanceof Promise) {
				const onAllCompleted = promiseResult.then(endOfQueue);
				activePromise = onAllCompleted;
				return await onAllCompleted;
			} else {
				return promiseResult;
			}
		}
	}

	function silentRegister(action: BidirectionalAction) {
		update(({ timeline, presentIndex }) => {
			const withoutFutureActions = timeline.slice(0, presentIndex);

			return {
				timeline: [...withoutFutureActions, action],
				presentIndex: presentIndex + 1
			};
		});
	}

	async function register(action: BidirectionalAction) {
		silentRegister(action);
		await enqueuePromise(action.do);
	}

	async function registerUndoable(name: string, doAction: UndoableFn) {
		let lastActionResult = await enqueuePromise(doAction);

		silentRegister({
			name,
			do: async () => {
				lastActionResult = await doAction();
			},
			undo: async () => {
				await lastActionResult.undo();
			}
		});
	}

	async function registerDelta<T>(name: string, { fromTo: states, apply }: DeltaOptions<T>) {
		register({
			name: name,
			do: () => apply(states[1]),
			undo: () => apply(states[0])
		});
	}

	async function registerDirectional(name: string, doAction: DirectionalFunction) {
		register({
			name: name,
			do: () => doAction('forward'),
			undo: () => doAction('backward')
		});
	}

	async function undo(): Promise<HistoryManipulationResult | null> {
		return new Promise((resolve) =>
			update(({ timeline, presentIndex }) => {
				if (presentIndex <= 0) {
					resolve(null);
					return { timeline, presentIndex };
				}

				const actionToUndo = timeline[presentIndex - 1];
				resolve({
					actionName: actionToUndo.name,
					completed: enqueuePromise(() => actionToUndo.undo())
				});

				return {
					presentIndex: presentIndex - 1,
					timeline
				};
			})
		);
	}

	async function redo(): Promise<HistoryManipulationResult | null> {
		return new Promise((resolve) =>
			update(({ timeline, presentIndex }) => {
				if (presentIndex >= timeline.length) {
					resolve(null);
					return { timeline, presentIndex };
				}

				const actionToRedo = timeline[presentIndex];
				resolve({
					actionName: actionToRedo.name,
					completed: enqueuePromise(() => actionToRedo.do())
				});

				return {
					presentIndex: presentIndex + 1,
					timeline
				};
			})
		);
	}

	return {
		subscribe,
		register,
		registerUndoable,
		registerDelta,
		registerDirectional,
		undo,
		redo
	};
};
