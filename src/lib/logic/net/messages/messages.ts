import type { AccountMessageCategory } from './account';
import type { BoardMessageCategory } from './board';
import type { CampaignMessageCategory } from './campaign';

export type AllMessages = AccountMessageCategory & BoardMessageCategory & CampaignMessageCategory;

export interface IMessage<P> {
	payload: P;
}
export interface IMessageForServer<P> extends IMessage<P> {
	payloadForServer: P;
}
export interface IMessageForClient<P> extends IMessage<P> {
	payloadForClient: P;
}
export interface IResponse<R> {
	response: R;
}

export interface IForward<F> {
	forwardedPayload: F;
}

export interface DefineSend<P, F> extends IMessageForServer<P>, IForward<F> {}
export type DefineSendAndForward<P> = DefineSend<P, P>;

export interface DefinePrivateRequest<P, R> extends IMessageForServer<P>, IResponse<R> {}
export interface DefineRequest<P, R, F> extends DefinePrivateRequest<P, R>, IForward<F> {}
export type DefineRequestWithPublicResponse<P, R> = DefineRequest<P, R, R>;

export type DefineServerBroadcast<P> = DefineSendAndForward<P>;

export type UUID = string;

export type PickMessages<T> = {
	[K in keyof AllMessages as AllMessages[K] extends T ? K : never]: AllMessages[K];
};
export type PickForwardedMessages<S> = {
	[K in keyof S as S[K] extends IForward<unknown> ? K : never]: S[K] extends IForward<unknown>
		? MarkedAsEvent
		: S[K];
};

export type MarkedAsEvent = {
	forwarded: true;
};

export type ServerSentMessages = PickMessages<IMessageForClient<unknown>> & ClientHandledEvents;
export type ServerHandledMessages = PickMessages<IMessageForServer<unknown>>;

export type ClientSentMessages = ServerHandledMessages;
export type ClientHandledMessages = ServerSentMessages;

export type ClientHandledEvents = PickForwardedMessages<ClientSentMessages>;

export type AsPayload<T> = T extends IMessage<infer P> ? P : never;
export type Payload<S, T extends keyof S> = AsPayload<S[T]>;
export type GetPayload<T extends keyof AllMessages> = Payload<AllMessages, T>;

export type AsResponseObject<T> = T extends IForward<infer F> & IResponse<infer R>
	? {
			forwardedResponse: F;
			response: R;
		}
	: T extends IForward<infer F>
		? {
				forwardedResponse: F;
			}
		: T extends IResponse<infer R>
			? R
			: void;
export type ResponseObject<S, T extends keyof S> = AsResponseObject<S[T]>;

export type AsResponse<T> = T extends IResponse<infer R> ? R : void;
export type Response<S, T extends keyof S> = AsResponse<S[T]>;
export type GetResponse<T extends keyof AllMessages> = Response<AllMessages, T>;

export type AsForwarded<T> = T extends IForward<infer F> ? F : void;
export type Forwarded<S, T extends keyof S> = AsForwarded<S[T]>;
export type GetForwarded<T extends keyof AllMessages> = Forwarded<AllMessages, T>;

export type OptionalForwarded<S, T> = Forwarded<S, T extends keyof S ? T : never>;
