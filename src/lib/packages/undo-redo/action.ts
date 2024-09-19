export type PromiseOr<T> = Promise<T> | T;

export type OneWayAction = () => PromiseOr<void>;

export interface BidirectionalAction {
	name: string;
	do: OneWayAction;
	undo: OneWayAction;
}

type UndoableFnResult = {
	undo: OneWayAction;
};

export type UndoableFn = () => PromiseOr<UndoableFnResult>;

export interface DeltaOptions<T> {
	fromTo: [T, T];
	apply: (state: T) => PromiseOr<void>;
}

export type Direction = 'forward' | 'backward';
export type DirectionalFunction = (direction: Direction) => PromiseOr<void>;
