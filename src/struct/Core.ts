import { Client, PermissionString, TextChannel } from "discord.js";
import { connect } from "mongoose";
import { IConfig, IOptionData, IMessageData } from "reaction-role";
import { SuperError } from "./SuperError";
import { Database } from "./database/Database";
import { RRRepository } from "./database/RRModel";

const CleanEmojiRegExp = /[A-Za-z0-9_]+:[0-9]+/;

export default class ReactionRole {
    private _token: string;
    private _mongodb_uri?: string;
    private _config: IConfig = [];
    private _database = Database;
    private _client = new Client({
        partials: ["REACTION", "CHANNEL", "USER", "MESSAGE", "GUILD_MEMBER"], // IDK Which one is required lol :D
    });
    constructor(token: string, mongodb_uri?: string) {
        this._token = token;
        this._mongodb_uri = mongodb_uri;
    }
    private cleanEmoji(emoji: string): string {
        const cleaned = CleanEmojiRegExp.exec(emoji);
        if (cleaned) return cleaned[0];
        return emoji;
    }
    public createOption(emoji: string, ...roles: string[]): IOptionData {
        return {
            emoji,
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
        if (this._client.user) {
            const channel = this._client.channels.cache.get(data.channelID);
            if (!channel)
                throw new SuperError(
                    "CanNotResolveChannel",
                    `Channel ${data.channelID} not found`,
                );
            const message = await (channel as TextChannel).messages
                .fetch(data.messageID)
                .catch((e) => {
                    throw new SuperError("CanNotFetchMesssage", e);
                });
            if (!message.guild)
                throw new SuperError(
                    "NoGuild",
                    `Message ${data.messageID} id not from a guild`,
                );
            data.guildID = message.guild.id;
            data.reactions.forEach(async (option) => {
                const emoji = this.cleanEmoji(option.emoji);
                const messageReaction = message.reactions.cache.get(emoji);
                if (!messageReaction)
                    await message.react(emoji).catch((e) => {
                        throw new SuperError("CanNotReactMesssage", e);
                    });
                else {
                    if (!messageReaction.me) {
                        await message.react(emoji).catch((e) => {
                            throw new SuperError("CanNotReactMesssage", e);
                        });
                    }
                }
            });
            if (this._mongodb_uri) await this._database.createMessage(data);
        }
        this._config.push(data);
        return data;
    }
    public async deleteMessage(
        messageID: string,
        channelID: string,
    ): Promise<void> {
        this._config = this._config.filter((messageData) => {
            return messageData.messageID != messageID;
        });
        if (this._client.user) {
            const channel = this._client.channels.cache.get(channelID);
            if (!channel)
                throw new SuperError(
                    "CanNotResolveChannel",
                    `Channel ${channelID} not found`,
                );
            const message = await (channel as TextChannel).messages
                .fetch(messageID)
                .catch((e) => {
                    throw new SuperError("CanNotFetchMesssage", e);
                });
            message.reactions.cache.forEach(async (reaction) => {
                await reaction.users
                    .remove(this._client.user?.id)
                    .catch((e) => {
                        throw new SuperError("CanNotRemoveReaction", e);
                    });
            });
            if (this._mongodb_uri)
                await this._database.deleteMessage(messageID);
        }
    }
    public async importConfig(config: IConfig): Promise<void> {
        if (this._client.user) {
            config.forEach(async (messageData) => {
                const channel = this._client.channels.cache.get(
                    messageData.channelID,
                );
                if (!channel)
                    throw new SuperError(
                        "CanNotResolveChannel",
                        `Channel ${messageData.channelID} not found`,
                    );
                const message = await (channel as TextChannel).messages
                    .fetch(messageData.messageID)
                    .catch((e) => {
                        throw new SuperError("CanNotFetchMesssage", e);
                    });
                if (!message.guild)
                    throw new SuperError(
                        "NoGuild",
                        `Message ${messageData.messageID} id not from a guild`,
                    );
                messageData.guildID = message.guild.id;
                messageData.reactions.forEach(async (option) => {
                    const emoji = this.cleanEmoji(option.emoji);
                    const messageReaction = message.reactions.cache.get(emoji);
                    if (!messageReaction)
                        await message.react(emoji).catch((e) => {
                            throw new SuperError("CanNotReactMesssage", e);
                        });
                    else {
                        if (!messageReaction.me) {
                            await message.react(emoji).catch((e) => {
                                throw new SuperError("CanNotReactMesssage", e);
                            });
                        }
                    }
                });
                if (this._mongodb_uri)
                    this._database.createMessage(messageData);
            });
        }
        this._config = this._config.concat(config);
    }
    public exportConfig(): IConfig {
        return this._config;
    }
    public async init(): Promise<string> {
        if (this._mongodb_uri) {
            console.info("[ReactionRole] Connecting to MongoDB...");
            await connect(this._mongodb_uri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            })
                .then(() => {
                    console.info(
                        "[ReactionRole] Successfully connected to MongoDB",
                    );
                })
                .catch((e) => {
                    throw new SuperError("MongoDBConnectionError", e);
                });
        }
        this._client.on("ready", async () => {
            if (this._mongodb_uri) {
                this._config.forEach(async (messageData) => {
                    const channel = this._client.channels.cache.get(
                        messageData.channelID,
                    );
                    if (!channel)
                        throw new SuperError(
                            "CanNotResolveChannel",
                            `Channel ${messageData.channelID} not found`,
                        );
                    messageData.guildID = (channel as TextChannel).guild.id;
                    await this._database.createMessage(messageData);
                });
                const savedData = await RRRepository.find();
                await this.importConfig(savedData);
            }
            console.info("[ReactionRole] Fetching messages...");
            this._config.forEach(async (messageData) => {
                const channel = this._client.channels.cache.get(
                    messageData.channelID,
                );
                if (!channel)
                    throw new SuperError(
                        "CanNotResolveChannel",
                        `Channel ${messageData.channelID} not found`,
                    );
                const message = await (channel as TextChannel).messages
                    .fetch(messageData.messageID)
                    .catch((e) => {
                        throw new SuperError("CanNotFetchMesssage", e);
                    });
                if (!message.guild)
                    throw new SuperError(
                        "NoGuild",
                        `Message ${messageData.messageID} id not from a guild`,
                    );
                messageData.reactions.forEach(async (option) => {
                    const emoji = this.cleanEmoji(option.emoji);
                    const messageReaction = message.reactions.cache.get(emoji);
                    if (!messageReaction)
                        await message.react(emoji).catch((e) => {
                            throw new SuperError("CanNotReactMesssage", e);
                        });
                    else {
                        if (!messageReaction.me) {
                            await message.react(emoji).catch((e) => {
                                throw new SuperError("CanNotReactMesssage", e);
                            });
                        }
                    }
                });
            });
            console.info("[ReactionRole] Fetched messages, system is ready!");
        });
        this._client.on("messageReactionAdd", async (reaction, user) => {
            if (!this._client.user) return;
            if (user.partial) user = await user.fetch();
            if (this._client.user.equals(user)) return;
            if (!reaction.message.guild) return;
            const member = reaction.message.guild.members.cache.get(user.id);
            if (!member) return;
            const cleanEmoji = this.cleanEmoji(reaction.emoji.toString());
            for (const messageData of this._config) {
                if (reaction.message.channel.id != messageData.channelID)
                    continue;
                if (reaction.message.id != messageData.messageID) continue;
                if (
                    messageData.restrictions &&
                    !member.permissions.has(messageData.restrictions)
                ) {
                    await reaction.users.remove(user.id).catch((e) => {
                        throw new SuperError("CanNotRemoveReaction", e);
                    });
                    continue;
                }
                const addRole: string[] = [];
                const whitelist: string[] = [];
                const blacklist: string[] = [];
                member.roles.cache.forEach((role) => addRole.push(role.id));
                for (const option of messageData.reactions) {
                    if (option.emoji == cleanEmoji)
                        whitelist.push(...option.roles);
                    else blacklist.push(...option.roles);
                }
                const configEmojis = messageData.reactions.map((r) => r.emoji);
                const reactionSize = reaction.message.reactions.cache
                    .filter((r) =>
                        configEmojis.includes(
                            this.cleanEmoji(r.emoji.toString()),
                        ),
                    )
                    .filter((r) => r.users.cache.has(user.id)).size;

                if (reactionSize > messageData.limit) {
                    await reaction.users.remove(user.id).catch((e) => {
                        throw new SuperError("CanNotRemoveReaction", e);
                    });
                    continue;
                }
                addRole.push(...whitelist);
                await member.roles.add(addRole).catch((e) => {
                    throw new SuperError("CanNotAddUserRoles", e);
                });
            }
        });
        this._client.on("messageReactionRemove", async (reaction, user) => {
            if (!this._client.user) return;
            if (user.partial) user = await user.fetch();
            if (this._client.user.equals(user)) return;
            if (!reaction.message.guild) return;
            const member = reaction.message.guild.members.cache.get(user.id);
            if (!member) return;
            const cleanEmoji = this.cleanEmoji(reaction.emoji.toString());
            for (const messageData of this._config) {
                if (reaction.message.channel.id != messageData.channelID)
                    continue;
                if (reaction.message.id != messageData.messageID) continue;
                const keep: string[] = [];
                const remove: string[] = [];
                for (const option of messageData.reactions) {
                    if (option.emoji == cleanEmoji)
                        remove.push(...option.roles);
                    else keep.push(...option.roles);
                }
                remove.filter(
                    (role) =>
                        !keep.includes(role) && member.roles.cache.has(role),
                );
                await member.roles.remove(remove).catch((e) => {
                    throw new SuperError("CanNotRemoveRole", e);
                });
            }
        });
        return this._client.login(this._token).catch(() => {
            throw new SuperError(
                "InvalidToken",
                "Please specify a valid BOT token.",
            );
        });
    }
    public async reInit(): Promise<string> {
        this._client.destroy();
        this._client = new Client({
            partials: [
                "REACTION",
                "CHANNEL",
                "USER",
                "MESSAGE",
                "GUILD_MEMBER",
            ], // IDK Which one is required lol :D
        });
        this._config = [];
        return this.init();
    }
}
