import { BookmanOptions, Database } from "bookman";
import { ChannelType, Client, TextChannel } from "discord.js";
import { set, unset, merge } from "lodash";
import { Logger } from "@hammerhq/logger";

export interface IButtonRoleButton {
	button_id: string;
	add_message?: string;
	remove_message?: string;
	roles: string[];
}

export interface IButtonRoleMessage {
	channel_id: string;
	message_id: string;
	limit: number;
	buttons: IButtonRoleButton[];
}

export interface IButtonRoleConfig {
	[message_id: string]: IButtonRoleMessage;
}

export type TButtonRoleOnGetFN = () =>
	| IButtonRoleConfig
	| undefined
	| Promise<IButtonRoleConfig | undefined>;
export type TButtonRoleSetFN = (
	new_data: IButtonRoleConfig,
) => IButtonRoleConfig | undefined | Promise<IButtonRoleConfig | undefined>;
export type TButtonRoleDeleteFN = (
	message_id: string,
) => undefined | Promise<undefined>;

export class ButtonRole extends Client {
	private _token: string;
	private _db_config: BookmanOptions;
	private config: IButtonRoleConfig = {};
	private logging: boolean;
	private ready = false;
	private on_get?: TButtonRoleOnGetFN;
	private on_set?: TButtonRoleSetFN;
	private on_delete?: TButtonRoleDeleteFN;
	private database: Database;
	public logger = new Logger("ButtonRole");

	constructor(
		token: string,
		db: BookmanOptions = {
			databaseName: "buttonrole",
			pretty: true,
			defaultDir: "data",
		},
		logging = true,
	) {
		super({
			intents: [
				"GuildEmojisAndStickers",
				"GuildMembers",
				"GuildMessageReactions",
				"GuildMessages",
				"Guilds",
			],
		});
		this._token = token;
		this.logging = logging;
		this.database = new Database(db);
		this._db_config = db;
		this.on_get = () => this.database.get("config");
		this.on_delete = (message_id) =>
			this.database.delete(`config.${message_id}`);
		this.on_set = (new_data) => this.database.set("config", new_data);
	}

	public onGet(on_get: TButtonRoleOnGetFN): ButtonRole {
		this.on_get = on_get;
		return this;
	}

	public onSet(on_set: TButtonRoleSetFN): ButtonRole {
		this.on_set = on_set;
		return this;
	}

	public onDelete(on_delete: TButtonRoleDeleteFN): ButtonRole {
		this.on_delete = on_delete;
		return this;
	}

	public createOption(
		button_id: string,
		roles: string[],
		add_message?: string,
		remove_message?: string,
	): IButtonRoleButton {
		return {
			button_id,
			roles,
			add_message,
			remove_message,
		};
	}

	public async createMessage(
		channel_id: string,
		message_id: string,
		limit: number,
		...buttons: IButtonRoleButton[]
	): Promise<IButtonRoleMessage> {
		const message: IButtonRoleMessage = {
			channel_id,
			buttons,
			message_id,
			limit,
		};
		set(this.config, message_id, message);
		if (this.on_set) await this.on_set(this.config);
		return message;
	}

	public async deleteMessage(message_id: string): Promise<IButtonRoleConfig> {
		unset(this.config, message_id);
		if (this.on_delete) await this.on_delete(message_id);
		return this.config;
	}

	public async importConfig(
		config: IButtonRoleConfig,
	): Promise<IButtonRoleConfig> {
		merge(this.config, config);
		if (this.on_get) {
			const saved = (await this.on_get()) || {};
			merge(saved, this.config);
			if (this.on_set) await this.on_set(saved);
		}
		return this.config;
	}

	public exportConfig = (): IButtonRoleConfig => this.config;

	public async init(): Promise<string> {
		const now = Date.now();
		if (this.logging) this.logger.event("Spawning ButtonRole...");

		this.on("ready", async () => {
			if (this.logging)
				this.logger.info(`Logged in as ${this.user?.tag}!`);
			if (this.on_get) {
				this.logger.event("Loading data from database.");
				const saved = (await this.on_get()) as IButtonRoleConfig;
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
					.catch(() => undefined)) as TextChannel | undefined;
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
				for (const button of message.buttons) {
					// TODO: Make sure message has button component
				}
			}

			// TODO: implement role assingment logic

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

		const token = await this.login(this._token);
		if (this.logging)
			this.logger.success("ButtonRole spawned successfully!");
		return token;
	}

	public async reInit(): Promise<ButtonRole> {
		this.destroy();
		const rr = new ButtonRole(this._token, this._db_config, this.logging);
		await rr.importConfig(this.config);
		return rr;
	}
}
