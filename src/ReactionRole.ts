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

export class ReactionRole extends Client {
	public logger = new Logger("ReactionRole");
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
		db_config: IDBOptions = default_db_config,
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
		this.database = new Database(db_config);
		this._db_config = db_config;

		this.on_get = () => this.database.get(db_config.prefix);
		this.on_delete = (message_id) =>
			this.database.delete(`${db_config.prefix}.${message_id}`);
		this.on_set = (new_data) =>
			this.database.set(db_config.prefix, new_data);
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

		if (this.logging) this.logger.event("Spawning ReactionRole...");

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
					if (
						!msg.reactions.cache.has(clickable.clickable_id) ||
						!msg.reactions.cache
							.get(clickable.clickable_id)
							?.users.cache.has(this.user?.id as string)
					)
						await msg.react(clickable.clickable_id);
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

		this.on("messageReactionAdd", async (reaction, user) => {
			if (!this.ready) return;

			if (reaction.partial) reaction = await reaction.fetch();
			if (!reaction.message.guild) return;
			if (user.partial) user = await user.fetch();
			if (!reaction.message.guild.members.cache.has(user.id)) return;
			if (!has(this.config, reaction.message.id)) return;

			const message = get(this.config, reaction.message.id);

			if (message.limit > 0) {
				const reactions = reaction.message.reactions.cache.filter(
					(r) =>
						message.clickables.some(
							(clickable) =>
								clickable.clickable_id ==
								(r.emoji.id || r.emoji.name),
						) && r.users.cache.has(user.id),
				);

				if (reactions.size > message.limit) {
					await reaction.users.remove(user.id);

					return;
				}
			}

			const clickable = message.clickables.find(
				(clickable) =>
					clickable.clickable_id ==
					(reaction.emoji.id || reaction.emoji.name),
			);

			if (!clickable) return;

			const member = reaction.message.guild?.members.cache.get(
				user.id,
			) as GuildMember;
			const roles_to_add = clickable.roles.filter(
				(id) => !member.roles.cache.has(id),
			);

			if (roles_to_add.length < 1) return;

			await member.roles.add(roles_to_add);

			if (clickable.add_message)
				await member.send(clickable.add_message).catch(() => undefined);
		});

		this.on("messageReactionRemove", async (reaction, user) => {
			if (!this.ready) return;

			if (reaction.partial) reaction = await reaction.fetch();
			if (!reaction.message.guild) return;
			if (user.partial) user = await user.fetch();
			if (!reaction.message.guild.members.cache.has(user.id)) return;
			if (!has(this.config, reaction.message.id)) return;

			const message = get(this.config, reaction.message.id);
			const clickable = message.clickables.find(
				(clickable) =>
					clickable.clickable_id ==
					(reaction.emoji.id || reaction.emoji.name),
			);

			if (!clickable) return;

			const member = reaction.message.guild?.members.cache.get(
				user.id,
			) as GuildMember;
			const roles_to_remove = clickable.roles.filter((id) =>
				member.roles.cache.has(id),
			);

			if (roles_to_remove.length < 1) return;

			await member.roles.remove(roles_to_remove);

			if (clickable.remove_message)
				await member
					.send(clickable.remove_message)
					.catch(() => undefined);
		});

		const token = await this.login(this._token);

		if (this.logging)
			this.logger.success("ReactionRole spawned successfully!");

		return token;
	}

	public async reInit(): Promise<ReactionRole> {
		this.destroy();

		const rr = new ReactionRole(this._token, this._db_config, this.logging);

		await rr.importConfig(this.config);

		return rr;
	}
}
