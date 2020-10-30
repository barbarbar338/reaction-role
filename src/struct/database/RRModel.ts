import { Schema, model, Document } from "mongoose";
import { IMessageData } from "reaction-role";

export interface IRREntity extends Document, IMessageData {}

export const RREntity = new Schema({
    messageID: {
        type: String,
        required: true,
    },
    channelID: {
        type: String,
        required: true,
    },
    guildID: {
        type: String,
        required: true,
    },
    limit: {
        type: Number,
        required: true,
    },
    restrictions: Object,
    reactions: {
        type: Object,
        required: true,
    },
});

export const RRRepository = model<IRREntity>(
    "RREntity",
    RREntity,
    "REACTION_ROLE_MODELS",
);
