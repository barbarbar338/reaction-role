import { Logger } from "@hammerhq/logger";
import { Database } from "bookman";
import { ChannelType, Client, GuildMember, TextChannel } from "discord.js";
import { get, has, merge, set, unset } from "lodash";
import {
	default_db_config,
	EType,
	IClickable,
	IConfig,
	IConstructorOptions,
	IDBOptions,
	IMessage,
	TOnDeleteEvent,
	TOnGetFN,
	TOnSetFN,
} from "./types";
import { parseFunction, stringifyFunction } from "./utils";

export class ReactionRole extends Client {
	public logger = new Logger("[ReactionRole]:");
	public ready = false;
	public database: Database;
	public config: IConfig = {};

	private _token: string;
	private _db_config: IDBOptions;
	private logging: boolean;
	private on_get?: TOnGetFN;
	private on_set?: TOnSetFN;
	private on_delete?: TOnDeleteEvent;

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
				new Function();
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

			const clickable = message.clickables.find(
				(clickable) =>
					clickable.clickable_id ==
					(reaction.emoji.id || reaction.emoji.name),
			);
			if (!clickable) return;
			const member = reaction.message.guild?.members.cache.get(
				user.id,
			) as GuildMember;

			if (message.limit && message.limit > 0) {
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

			const roles = clickable.roles.filter((id) =>
				clickable.type == EType.REMOVE
					? member.roles.cache.has(id)
					: !member.roles.cache.has(id),
			);
			if (roles.length < 1) return;

			switch (clickable.type) {
				case EType.NORMAL:
					await member.roles.add(roles);
					break;
				case EType.ONCE:
					await member.roles.add(roles);
					await reaction.users.remove(member.id);
					break;
				case EType.REMOVE:
					await member.roles.remove(roles);
					break;
				case EType.CUSTOM:
					await member.roles.add(roles);
					if (clickable.onClick) {
						const fn = parseFunction(
							clickable.onClick as unknown as string,
						);
						fn(clickable, member);
					}
			}

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

			// işlem iptal ediliyor çünkü ONCE türündeki clickable componentlerde reaction otomatik olarak kaldırılıyor.
			// bu yüzden reaction remove eventi tetikleniyor ve rolün tekrar kaldırılmaması gerekiyor.
			if (clickable.type == EType.ONCE) return;

			const member = reaction.message.guild?.members.cache.get(
				user.id,
			) as GuildMember;
			const roles = clickable.roles.filter((id) =>
				clickable.type == EType.REMOVE
					? !member.roles.cache.has(id)
					: member.roles.cache.has(id),
			);

			if (roles.length < 1) return;

			switch (clickable.type) {
				case EType.NORMAL:
					await member.roles.remove(roles);
					break;
				case EType.REMOVE:
					await member.roles.add(roles);
					break;
				case EType.CUSTOM:
					await member.roles.remove(roles);
					if (clickable.onRemove) {
						const fn = parseFunction(
							clickable.onRemove as unknown as string,
						);
						fn(clickable, member);
					}
			}

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

		const rr = new ReactionRole({
			token: this._token,
			db_config: this._db_config,
			logging: this.logging,
		});

		await rr.importConfig(this.config);

		return rr;
	}
}
