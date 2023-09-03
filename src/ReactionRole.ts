import { Logger } from "@hammerhq/logger";
import { Database } from "bookman";
import { Client } from "discord.js";
import { merge, set, unset } from "lodash";
import { handleEvents } from "./events";
import {
	IClickable,
	IConfig,
	IConstructorOptions,
	IDBOptions,
	IMessage,
	TOnDeleteEvent,
	TOnGetFN,
	TOnSetFN,
	default_db_config,
} from "./types";
import { stringifyFunction } from "./utils";

export class ReactionRole extends Client {
	public logger = new Logger("[ReactionRole]:");
	public ready = false;
	public database: Database;
	public config: IConfig = {};

	public _token: string;
	public _db_config: IDBOptions;
	public logging: boolean;
	public on_get?: TOnGetFN;
	public on_set?: TOnSetFN;
	public on_delete?: TOnDeleteEvent;

	constructor({ token, db_config, logging }: IConstructorOptions) {
		super({
			intents: [
				"GuildEmojisAndStickers",
				"GuildMembers",
				"GuildMessageReactions",
				"GuildMessages",
				"Guilds",
			],
		});

		const cfg = merge(default_db_config || {}, db_config);

		this._token = token;
		this.logging = logging || false;
		this.database = new Database(cfg);
		this._db_config = cfg;

		this.on_get = () => this.database.get(cfg.prefix);
		this.on_delete = (message_id) =>
			this.database.delete(`${cfg.prefix}.${message_id}`);
		this.on_set = (new_data) => this.database.set(cfg.prefix, new_data);
	}

	public onGet(on_get: TOnGetFN): ReactionRole {
		this.on_get = on_get;

		return this;
	}

	public onSet(on_set: TOnSetFN): ReactionRole {
		this.on_set = on_set;

		return this;
	}

	public onDelete(on_delete: TOnDeleteEvent): ReactionRole {
		this.on_delete = on_delete;

		return this;
	}

	public createOption = (clickable: IClickable): IClickable => clickable;

	public async createMessage(message: IMessage): Promise<IMessage> {
		const clone = { ...message };
		for (const clickable of message.clickables) {
			if (clickable.onClick)
				(clickable.onClick as any) = stringifyFunction(
					clickable.onClick,
				);
			if (clickable.onRemove)
				(clickable.onRemove as any) = stringifyFunction(
					clickable.onRemove,
				);
		}

		set(this.config, message.message_id, message);
		if (this.on_set) await this.on_set(this.config);

		return clone;
	}

	public async deleteMessage(message_id: string): Promise<IConfig> {
		unset(this.config, message_id);
		if (this.on_delete) await this.on_delete(message_id);

		return this.config;
	}

	public async importConfig(config: IConfig): Promise<IConfig> {
		merge(this.config, config);

		if (this.on_get) {
			const saved = (await this.on_get()) || {};

			merge(saved, this.config);
			if (this.on_set) await this.on_set(saved);
		}

		return this.config;
	}

	public exportConfig = (): IConfig => this.config;

	public async init(): Promise<string> {
		if (this.logging) this.logger.event("Spawning ReactionRole...");

		handleEvents(this);

		const token = await this.login(this._token);

		if (this.logging)
			this.logger.success("ReactionRole spawned successfully!");

		return token;
	}
}
