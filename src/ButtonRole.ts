import { BookmanOptions, Database } from "bookman";
import { ChannelType, Client, GuildMember, TextChannel } from "discord.js";
import { set, unset, merge, has, get } from "lodash";
import { Logger } from "@hammerhq/logger";
import {
	default_db_config,
	IClickable,
	IConfig,
	IDBOptions,
	IMessage,
	TOnDeleteEvent,
	TOnGetFN,
	TOnSetFN,
} from "./types";

export class ButtonRole extends Client {
	public logger = new Logger("ButtonRole");
	public ready = false;
	public database: Database;
	public config: IConfig = {};

	private _token: string;
	private _db_config: IDBOptions;
	private logging: boolean;
	private on_get?: TOnGetFN;
	private on_set?: TOnSetFN;
	private on_delete?: TOnDeleteEvent;

	constructor(
		token: string,
		db_config: IDBOptions = {
			...default_db_config,
			prefix: "buttons",
		},
		logging = true,
	) {
		super({
			intents: [
				"GuildIntegrations",
				"GuildMembers",
				"GuildMessages",
				"Guilds",
			],
		});

		this._token = token;
		this.logging = logging;
		this.database = new Database(db_config);
		this._db_config = db_config;

		this.on_get = () => this.database.get(db_config.prefix);
		this.on_delete = (message_id) =>
			this.database.delete(`${db_config.prefix}.${message_id}`);
		this.on_set = (new_data) =>
			this.database.set(db_config.prefix, new_data);
	}

	public onGet(on_get: TOnGetFN): ButtonRole {
		this.on_get = on_get;

		return this;
	}

	public onSet(on_set: TOnSetFN): ButtonRole {
		this.on_set = on_set;

		return this;
	}

	public onDelete(on_delete: TOnDeleteEvent): ButtonRole {
		this.on_delete = on_delete;

		return this;
	}

	public createOption = (
		clickable_id: string,
		roles: string[],
		add_message?: string,
		remove_message?: string,
	): IClickable => ({
		clickable_id,
		roles,
		add_message,
		remove_message,
	});

	public async createMessage(
		channel_id: string,
		message_id: string,
		limit: number,
		...clickables: IClickable[]
	): Promise<IMessage> {
		const message: IMessage = {
			channel_id,
			clickables,
			message_id,
			limit,
		};

		set(this.config, message_id, message);
		if (this.on_set) await this.on_set(this.config);

		return message;
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
		const now = Date.now();

		if (this.logging) this.logger.event("Spawning ButtonRole...");

		this.on("ready", async () => {
			if (this.logging)
				this.logger.info(`Logged in as ${this.user?.tag}!`);

			if (this.on_get) {
				this.logger.event("Loading data from database.");

				const saved = (await this.on_get()) as IConfig;
				if (saved) {
					this.logger.info(
						`Importing ${Object.keys(saved).length} messages...`,
					);

					this.importConfig(saved);

					this.logger.success(
						`Successfully imported ${
							Object.keys(saved).length
						} messages!`,
					);
				} else this.logger.warning("Database is empty.");
			}

			if (this.logging) {
				this.logger.event("Fetching messages.");
				this.logger.info(
					`Fetching ${Object.keys(this.config).length} messages...`,
				);
			}

			for (const message_id in this.config) {
				const message = this.config[message_id];
				const channel = (await this.channels
					.fetch(message.channel_id)
					.catch(() => undefined)) as TextChannel;

				if (!channel || channel.type != ChannelType.GuildText) {
					this.deleteMessage(message.message_id);
					continue;
				}

				const msg = await channel.messages
					.fetch(message.message_id)
					.catch(() => undefined);

				if (!msg) {
					this.deleteMessage(message.message_id);
					continue;
				}

				for (const clickable of message.clickables) {
					// TODO: Check if message has button component.
				}
			}

			if (this.logging)
				this.logger.success(
					`Successfully fetched ${
						Object.keys(this.config).length
					} messages!`,
				);

			this.ready = true;

			const then = Date.now();

			if (this.logging)
				this.logger.success("Ready 🚀! Took", then - now, "ms");
		});

		// TODO: Check if button is clicked. Use "interactionCreate" event.

		const token = await this.login(this._token);

		if (this.logging)
			this.logger.success("ButtonRole spawned successfully!");

		return token;
	}

	public async reInit(): Promise<ButtonRole> {
		this.destroy();

		const br = new ButtonRole(this._token, this._db_config, this.logging);

		await br.importConfig(this.config);

		return br;
	}
}
