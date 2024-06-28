import type { HydratedDocument, Types } from 'mongoose';

export type Hydrated<T, U> = HydratedDocument<T, U>;
export type DocumentArray<T> = Types.DocumentArray<T>;
export type SubDocument<T> = Types.Subdocument<T>;

export interface Timestamped {
	createdAt: Date;
	updatedAt: Date;
}

export type Asset = string;
export const AssetType = String;