import { adapters, Database } from "bookman";
import { Client, GuildMember, TextChannel, Util } from "discord.js";
import { set, unset, merge, has, get } from "lodash";
import * as pogger from "pogger";

export interface IEmoji {
	emoji: string;
	add_message?: string;
	remove_message?: string;
	roles: string[];
}

export interface IMessage {
	channel_id: string;
	message_id: string;
	limit: number;
	type: "regular" | "once" | "remove" | "voice";
	emojis: IEmoji[];
}

export interface IConfig {
	[message_id: string]: IMessage;
}

export type TOnGetFN = () => Promise<IConfig | undefined>;
export type TOnSetFN = (new_data: IConfig) => Promise<void>;
export type TOnDeleteFN = (message_id: string) => Promise<void>;

export class ReactionRole extends Client {
	private _token: string;
	private mongodb_uri?: string;
	private config: IConfig = {};
	private logging: boolean;
	private ready = false;
	private on_get?: TOnGetFN;
	private on_set?: TOnSetFN;
	private on_delete?: TOnDeleteFN;

	constructor(token: string, mongodb_uri?: string, logging = true) {
		super({
			partials: ["CHANNEL", "REACTION", "MESSAGE"],
		});
		this._token = token;
		this.mongodb_uri = mongodb_uri;
		this.logging = logging;
		if (mongodb_uri) {
			const adapter = new adapters.MongoDB({
				databaseName: "RR",
				defaultDir: "ReactionRole",
				mongodbURL: mongodb_uri,
			});
			const db = new Database(adapter);
			this.onGet(async () => {
				const data = (await db.get("config")) as IConfig;
				return data;
			})
				.onSet(async (new_data) => {
					await db.set("config", new_data);
				})
				.onDelete(async (message_id) => {
					await db.delete(`config.${message_id}`);
				});
		}
	}

	public onGet(on_get: TOnGetFN): ReactionRole {
		this.on_get = on_get;
		return this;
	}

	public onSet(on_set: TOnSetFN): ReactionRole {
		this.on_set = on_set;
		return this;
	}

	public onDelete(on_delete: TOnDeleteFN): ReactionRole {
		this.on_delete = on_delete;
		return this;
	}

	public createOption(
		emoji: string,
		roles: string[],
		add_message?: string,
		remove_message?: string,
	): IEmoji {
		const parsed = Util.parseEmoji(emoji);
		if (!parsed) throw new Error("Valid emoji expected");
		return {
			emoji: parsed.id || parsed.name,
			roles,
			add_message,
			remove_message,
		};
	}

	public async createMessage(
		channel_id: string,
		message_id: string,
		limit: number,
		...emojis: IEmoji[]
	): Promise<IMessage> {
		const message: IMessage = {
			channel_id,
			emojis,
			message_id,
			limit,
			type: "regular",
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
			if (this.on_set) {
				await this.on_set(saved);
			}
		}
		return this.config;
	}

	public exportConfig = (): IConfig => this.config;

	public async init(): Promise<string> {
		if (this.logging)
			pogger.event("[ReactionRole]: Spawning ReactionRole...");

		this.on("ready", async () => {
			if (this.logging)
				pogger.info(`[ReactionRole]: Logged in as ${this.user?.tag}!`);
			if (this.on_get) {
				pogger.event("[ReactionRole]: Loading data from database.");
				const saved = (await this.on_get()) as IConfig;
				if (saved) {
					pogger.info(
						`[ReactionRole]: Importing ${
							Object.keys(saved).length
						} messages...`,
					);
					this.importConfig(saved);
					pogger.success(
						`[ReactionRole]: Successfully imported ${
							Object.keys(saved).length
						} messages!`,
					);
				} else pogger.warning("[ReactionRole]: Database is empty.");
			}
			if (this.logging)
				pogger.event("[ReactionROle]: Fetching messages.");
			if (this.logging)
				pogger.info(
					`[ReactionRole]: Fetching ${
						Object.keys(this.config).length
					} messages...`,
				);
			for (const message_id in this.config) {
				const message = this.config[message_id];
				const channel = (await this.channels
					.fetch(message.channel_id)
					.catch(() => undefined)) as TextChannel | undefined;
				if (!channel || channel.type != "text") {
					this.deleteMessage(message.message_id);
					continue;
				}
				const msg = await channel.messages
					.fetch(message.message_id)
					.catch(() => undefined);
				if (!msg || msg.deleted) {
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
				pogger.success(
					`[ReactionRole]: Successfully fetched ${
						Object.keys(this.config).length
					} messages!`,
				);
			this.ready = true;
			if (this.logging) pogger.success("[ReactionRole]: Ready 🚀!");
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
				if (reactions.size > message.limit)
					return await reaction.users.remove(user.id);
			}

			const emoji = message.emojis.find(
				(emoji) =>
					emoji.emoji == (reaction.emoji.id || reaction.emoji.name),
			);
			if (!emoji) return;
			const member = reaction.message.guild?.member(
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
			const member = reaction.message.guild?.member(
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
			pogger.success(
				"[ReactionRole]: ReactionRole spawned successfully!",
			);
		return token;
	}

	public async reInit(): Promise<ReactionRole> {
		this.destroy();
		const rr = new ReactionRole(this._token, this.mongodb_uri);
		await rr.importConfig(this.config);
		await rr.init();
		return rr;
	}
}
