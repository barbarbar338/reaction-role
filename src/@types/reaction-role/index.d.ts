declare module "reaction-role" {
    export interface IReactionRoleConfig {
        token: string;
        mongodb_uri?: string;
    }
    export interface IRoleData {
        add: string[];
        remove: string[];
    }
    export interface IOptionMessageData {
        addMessage: string;
        removeMessage: string;
    }
    export interface IOptionData extends IRoleData, IOptionMessageData {
        emoji: string;
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
