import { BookmanOptions, Database } from "bookman";
import { ChannelType, Client, GuildMember, TextChannel } from "discord.js";
import { set, unset, merge, has, get } from "lodash";
import { Logger } from "@hammerhq/logger";

export interface IReactionRoleEmoji {
	emoji: string;
	add_message?: string;
	remove_message?: string;
	roles: string[];
}

export interface IReactionRoleMessage {
	channel_id: string;
	message_id: string;
	limit: number;
	emojis: IReactionRoleEmoji[];
}

export interface IReactionRoleConfig {
	[message_id: string]: IReactionRoleMessage;
}

export type TReactionRoleOnGetFN = () =>
	| IReactionRoleConfig
	| undefined
	| Promise<IReactionRoleConfig | undefined>;
export type TReactionRoleOnSetFN = (
	new_data: IReactionRoleConfig,
) => IReactionRoleConfig | undefined | Promise<IReactionRoleConfig | undefined>;
export type TReactionRoleOnDeleteFN = (
	message_id: string,
) => undefined | Promise<undefined>;

export class ReactionRole extends Client {
	private _token: string;
	private _db_config: BookmanOptions;
	private config: IReactionRoleConfig = {};
	private logging: boolean;
	private ready = false;
	private on_get?: TReactionRoleOnGetFN;
	private on_set?: TReactionRoleOnSetFN;
	private on_delete?: TReactionRoleOnDeleteFN;
	private database: Database;
	public logger = new Logger("ReactionRole");

	constructor(
		token: string,
		db: BookmanOptions = {
			databaseName: "reactionrole",
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

	public onGet(on_get: TReactionRoleOnGetFN): ReactionRole {
		this.on_get = on_get;
		return this;
	}

	public onSet(on_set: TReactionRoleOnSetFN): ReactionRole {
		this.on_set = on_set;
		return this;
	}

	public onDelete(on_delete: TReactionRoleOnDeleteFN): ReactionRole {
		this.on_delete = on_delete;
		return this;
	}

	public createOption(
		emoji: string,
		roles: string[],
		add_message?: string,
		remove_message?: string,
	): IReactionRoleEmoji {
		return {
			emoji,
			roles,
			add_message,
			remove_message,
		};
	}

	public async createMessage(
		channel_id: string,
		message_id: string,
		limit: number,
		...emojis: IReactionRoleEmoji[]
	): Promise<IReactionRoleMessage> {
		const message: IReactionRoleMessage = {
			channel_id,
			emojis,
			message_id,
			limit,
		};
		set(this.config, message_id, message);
		if (this.on_set) await this.on_set(this.config);
		return message;
	}

	public async deleteMessage(
		message_id: string,
	): Promise<IReactionRoleConfig> {
		unset(this.config, message_id);
		if (this.on_delete) await this.on_delete(message_id);
		return this.config;
	}

	public async importConfig(
		config: IReactionRoleConfig,
	): Promise<IReactionRoleConfig> {
		merge(this.config, config);
		if (this.on_get) {
			const saved = (await this.on_get()) || {};
			merge(saved, this.config);
			if (this.on_set) await this.on_set(saved);
		}
		return this.config;
	}

	public exportConfig = (): IReactionRoleConfig => this.config;

	public async init(): Promise<string> {
		const now = Date.now();
		if (this.logging) this.logger.event("Spawning ReactionRole...");

		this.on("ready", async () => {
			if (this.logging)
				this.logger.info(`Logged in as ${this.user?.tag}!`);
			if (this.on_get) {
				this.logger.event("Loading data from database.");
				const saved = (await this.on_get()) as IReactionRoleConfig;
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
				for (const emoji of message.emojis) {
					if (
						!msg.reactions.cache.has(emoji.emoji) ||
						!msg.reactions.cache
							.get(emoji.emoji)
							?.users.cache.has(this.user?.id as string)
					)
						await msg.react(emoji.emoji);
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
						message.emojis.some(
							(emoji) =>
								emoji.emoji == (r.emoji.id || r.emoji.name),
						) && r.users.cache.has(user.id),
				);
				if (reactions.size > message.limit) {
					await reaction.users.remove(user.id);
					return;
				}
			}

			const emoji = message.emojis.find(
				(emoji) =>
					emoji.emoji == (reaction.emoji.id || reaction.emoji.name),
			);
			if (!emoji) return;
			const member = reaction.message.guild?.members.cache.get(
				user.id,
			) as GuildMember;
			const roles_to_add = emoji.roles.filter(
				(id) => !member.roles.cache.has(id),
			);
			if (roles_to_add.length < 1) return;
			await member.roles.add(roles_to_add);
			if (emoji.add_message)
				await member.send(emoji.add_message).catch(() => undefined);
		});

		this.on("messageReactionRemove", async (reaction, user) => {
			if (!this.ready) return;
			if (reaction.partial) reaction = await reaction.fetch();
			if (!reaction.message.guild) return;
			if (user.partial) user = await user.fetch();
			if (!reaction.message.guild.members.cache.has(user.id)) return;
			if (!has(this.config, reaction.message.id)) return;
			const message = get(this.config, reaction.message.id);
			const emoji = message.emojis.find(
				(emoji) =>
					emoji.emoji == (reaction.emoji.id || reaction.emoji.name),
			);
			if (!emoji) return;
			const member = reaction.message.guild?.members.cache.get(
				user.id,
			) as GuildMember;
			const roles_to_remove = emoji.roles.filter((id) =>
				member.roles.cache.has(id),
			);
			if (roles_to_remove.length < 1) return;
			await member.roles.remove(roles_to_remove);
			if (emoji.remove_message)
				await member.send(emoji.remove_message).catch(() => undefined);
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
