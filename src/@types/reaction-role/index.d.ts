declare module "reaction-role" {
    export interface IReactionRoleConfig {
        token: string;
        mongodb_uri?: string;
    }
    export interface IOptionData {
        emoji: string;
        roles: string[];
    }
    export interface IMessageData {
        messageID: string;
        channelID: string;
        guildID?: string;
        limit: number;
        restrictions?: import("discord.js").PermissionString[];
        reactions: IOptionData[];
    }
    export type IConfig = IMessageData[];
}
