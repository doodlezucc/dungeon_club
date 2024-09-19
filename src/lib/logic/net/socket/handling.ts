import type {
	AccountMessageCategory,
	BoardMessageCategory,
	CampaignMessageCategory,
	Forwarded,
	MarkedAsEvent,
	Payload,
	ResponseObject
} from '../messages';

export type PickStringKeysOfIntersection<A, B> = Pick<A, keyof A & keyof B & string>;
export type StringKeysOf<A, B> = keyof PickStringKeysOfIntersection<A, B>;

export type EventHandlerName<K extends string> = `on${Capitalize<K>}`;
export type HandlerName<K extends string> = `handle${Capitalize<K>}`;

export type CategoryHandlers<CATEGORY, HANDLED, OPTIONS> = {
	[K in StringKeysOf<CATEGORY, HANDLED> as HANDLED[K] extends MarkedAsEvent
		? EventHandlerName<K>
		: HandlerName<K>]: HANDLED[K] extends MarkedAsEvent
		? (payload: Forwarded<CATEGORY, K>, options: OPTIONS) => void
		: (payload: Payload<CATEGORY, K>, options: OPTIONS) => Promise<ResponseObject<CATEGORY, K>>;
};

export abstract class MessageHandler<HANDLED, OPTIONS> {
	abstract account: CategoryHandlers<AccountMessageCategory, HANDLED, OPTIONS>;
	abstract board: CategoryHandlers<BoardMessageCategory, HANDLED, OPTIONS>;
	abstract campaign: CategoryHandlers<CampaignMessageCategory, HANDLED, OPTIONS>;

	private _allHandlers: CategoryHandlers<unknown, HANDLED, OPTIONS>[] | undefined;
	get allHandlers() {
		return (this._allHandlers ??= [this.account, this.board, this.campaign]);
	}

	handle<T extends keyof HANDLED & string>(
		name: T,
		payload: Payload<HANDLED, T>,
		options: OPTIONS
	): Promise<ResponseObject<HANDLED, T>> {
		const nameCapitalized = name.substring(0, 1).toUpperCase() + name.substring(1);

		try {
			// Look for request handler
			return this.runHandler(`handle${nameCapitalized}` as HandlerName<T>, payload, options);
		} catch (err) {
			if (!(err instanceof UnhandledMessageError)) {
				throw err;
			}

			try {
				// Look for event handler
				return this.runHandler(`on${nameCapitalized}` as EventHandlerName<T>, payload, options);
			} catch (err) {
				if (!(err instanceof UnhandledMessageError)) {
					throw err;
				}
			}
		}

		throw 'Unhandled message';
	}

	runHandler<T extends keyof HANDLED & string>(
		handlerName: HandlerName<T> | EventHandlerName<T>,
		payload: Payload<HANDLED, T>,
		options: OPTIONS
	): Promise<ResponseObject<HANDLED, T>> {
		const handlerNameCasted = handlerName as keyof CategoryHandlers<unknown, HANDLED, OPTIONS>;

		for (const handlerCategory of this.allHandlers) {
			if (handlerName in handlerCategory) {
				const handle = handlerCategory[handlerNameCasted] as (
					payload: Payload<HANDLED, T>,
					options: OPTIONS
				) => Promise<ResponseObject<HANDLED, T>>;

				return handle(payload, options);
			}
		}

		throw new UnhandledMessageError();
	}
}

class UnhandledMessageError extends Error {}

export function publicResponse<R>(response: R) {
	return {
		forwardedResponse: response,
		response: response
	};
}
