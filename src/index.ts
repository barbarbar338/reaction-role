import {
	Client,
	MessageReaction,
	PermissionString,
	TextChannel,
} from "discord.js";
import { Database, adapters } from "bookman";

export interface IOptionData {
	emoji: string;
	addMessage: string;
	removeMessage: string;
	roles: string[];
}

export interface IMessageData {
	messageID: string;
	channelID: string;
	limit: number;
	restrictions?: PermissionString[];
	reactions: IOptionData[];
}

export interface IConfig {
	[messageID: string]: IMessageData;
}

export class ReactionRole extends Client {
	private _token: string;
	private database: Database;
	private ready = false;

	constructor(token: string, mongodb_uri?: string) {
		super();
		this._token = token;
		let adapter;
		if (mongodb_uri)
			adapter = new adapters.MongoDB({
				databaseName: "RR",
				defaultDir: "ReactionRole",
				mongodbURL: mongodb_uri,
			});
		else
			adapter = new adapters.FS({
				databaseName: "RR",
				defaultDir: "ReactionRole",
			});
		this.database = new Database(adapter);
	}

	public createOption(
		emoji: string,
		addMessage: string,
		removeMessage: string,
		roles: string[],
	): IOptionData {
		return {
			emoji,
			addMessage,
			removeMessage,
			roles,
		};
	}

	public async createMessage(
		messageID: string,
		channelID: string,
		limit: number,
		restrictions: PermissionString[],
		...reactions: IOptionData[]
	): Promise<IMessageData> {
		const data: IMessageData = {
			messageID,
			channelID,
			limit,
			restrictions,
			reactions,
		};
		await this.database.set(messageID, data);
		return data;
	}

	public async deleteMessage(messageID: string): Promise<IConfig> {
		await this.database.delete(messageID);
		return this.exportConfig();
	}

	public async importConfig(config: IConfig): Promise<IConfig> {
		for (const data in config) {
			const messageData = config[data];
			await this.database.set(messageData.messageID, messageData);
		}
		return this.exportConfig();
	}

	public async exportConfig(): Promise<IConfig> {
		const data = ((await this.database.fetchAll()) as unknown) as IConfig;
		return data;
	}

	public async init(): Promise<string> {
		console.info("[ReactionRole] Spawned.");
		this.on("ready", async () => {
			let messages = await this.exportConfig();
			console.info(
				`[ReactionRole] Fetching ${
					Object.keys(messages).length
				} messages.`,
			);
			for (const messageID in messages) {
				const messageData = messages[messageID];
				const channel = this.channels.cache.get(
					messageData.channelID,
				) as TextChannel;
				if (!channel) {
					this.database.delete(messageID);
					continue;
				}
				const guild = channel.guild;
				if (!guild) {
					this.database.delete(messageID);
					continue;
				}
				const message = await channel.messages
					.fetch(messageID)
					.catch(() => {
						this.database.delete(messageID);
					});
				if (!message) continue;
				for (let i = 0; i < messageData.reactions.length; i++) {
					const option = messageData.reactions[i];
					const newAddRoles: string[] = [];
					for (const role of option.roles) {
						if (guild.roles.cache.has(role)) newAddRoles.push(role);
					}
					let updated = false;
					if (option.roles.length != newAddRoles.length) {
						option.roles = newAddRoles;
						updated = true;
					}
					if (updated) {
						messageData.reactions[i].roles = newAddRoles;
						this.database.set(
							`${messageID}.reactions`,
							messageData.reactions,
						);
					}
					if (!message.reactions.cache.has(option.emoji))
						await message.react(option.emoji);
				}
			}
			messages = await this.exportConfig();
			console.info(
				`[ReactionRole] Fetched ${
					Object.keys(messages).length
				} messages.`,
			);
			console.info(
				`[ReactionRole] Ready and logged in as ${this.user?.tag} (${this.user?.id})`,
			);
			this.ready = true;
		}).on("raw", async (packet) => {
			if (
				!this.ready ||
				(packet.t != "MESSAGE_REACTION_ADD" &&
					packet.t != "MESSAGE_REACTION_REMOVE")
			)
				return;
			const messageData = (await this.database.get(
				packet.d.message_id,
			)) as IMessageData;
			if (!messageData) return;
			const guild = this.guilds.cache.get(packet.d.guild_id);
			if (!guild) return;
			for (const option of messageData.reactions) {
				for (const id of option.roles) {
					const role = guild.roles.cache.get(id);
					if (!role) return;
				}
			}
			const member =
				guild.members.cache.get(packet.d.user_id) ||
				(await guild.members.fetch(packet.d.user_id));
			if (!member) return;
			if (
				messageData.restrictions &&
				!member.permissions.has(messageData.restrictions)
			)
				return;
			const channel = guild.channels.cache.get(
				packet.d.channel_id,
			) as TextChannel;
			if (!channel) return;
			const message =
				channel.messages.cache.get(packet.d.message_id) ||
				(await channel.messages.fetch(packet.d.message_id));
			if (!message) return;
			const option = messageData.reactions.find(
				(o) =>
					o.emoji === packet.d.emoji.name ||
					o.emoji === packet.d.emoji.id,
			);
			if (!option) return;
			const reaction = message.reactions.cache.get(
				option.emoji,
			) as MessageReaction;
			if (!reaction) await message.react(option.emoji);
			if (packet.t === "MESSAGE_REACTION_ADD") {
				let userReactions = 0;
				for (const r of message.reactions.cache.array()) {
					const users = await r.users.fetch();
					if (users.has(member.id)) userReactions++;
				}
				if (userReactions > messageData.limit) return;
				await member.roles.add(option.roles);
				if (option.addMessage)
					await member.send(option.addMessage).catch(() => undefined);
			} else {
				await member.roles.remove(option.roles);
				if (option.removeMessage)
					await member
						.send(option.removeMessage)
						.catch(() => undefined);
			}
		});
		return this.login(this._token);
	}

	public async reInit(): Promise<ReactionRole> {
		this.destroy();
		const system = new ReactionRole(this._token);
		await system.init();
		return system;
	}
}
