import { BookmanOptions } from "bookman";

export interface IDBOptions extends BookmanOptions {
	prefix: string;
}

export interface IConstructorOptions {
	token: string;
	db_config?: IDBOptions;
	logging?: boolean;
}

export const default_db_config: IDBOptions = {
	databaseName: "reactionrole",
	pretty: true,
	defaultDir: "data",
	prefix: "reactions",
};

export enum EType {
	NORMAL,
	ONCE,
	REMOVE,
}

export interface IClickable {
	add_message?: string;
	remove_message?: string;
	roles: string[];
	type: EType;
	clickable_id: string;
}

export interface IMessage {
	channel_id: string;
	message_id: string;
	limit: number;
	clickables: IClickable[];
}

export interface IConfig {
	[message_id: string]: IMessage;
}

export type TOnGetFN = () => IConfig | Promise<IConfig> | undefined;
export type TOnSetFN = (
	config: IConfig,
) => IConfig | Promise<IConfig> | undefined;
export type TOnDeleteEvent = (message_id: string) => void | Promise<void>;
