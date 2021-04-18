import { adapters, Database } from "bookman/dist";
import { Client, GuildMember, TextChannel } from "discord.js";
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
	emojis: IEmoji[];
}

export interface IConfig {
	[message_id: string]: IMessage;
}

export class ReactionRole extends Client {
	private _token: string;
	private mongodb_uri?: string;
	private config: IConfig = {};
	private db?: Database;
	private logging: boolean;
	private ready = false;

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
			this.db = new Database(adapter);
		}
	}

	public createOption(
		emoji: string,
		roles: string[],
		add_message?: string,
		remove_message?: string,
	): IEmoji {
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
		...emojis: IEmoji[]
	): Promise<IMessage> {
		const message: IMessage = {
			channel_id,
			emojis,
			message_id,
			limit,
		};
		set(this.config, message_id, message);
		if (this.db) await this.db.set(`config.${message_id}`, message);
		return message;
	}

	public async deleteMessage(message_id: string): Promise<IConfig> {
		unset(this.config, message_id);
		if (this.db) await this.db.delete(`config.${message_id}`);
		return this.config;
	}

	public async importConfig(config: IConfig): Promise<IConfig> {
		merge(this.config, config);
		if (this.db) {
			const saved = await this.db.get("config");
			merge(saved, this.config);
			await this.db.set("config", saved);
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
			if (this.db) {
				pogger.event("[ReactionRole]: Loading data from database.");
				const saved = (await this.db.get("config")) as IConfig;
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
