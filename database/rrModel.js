const Mongoose = require("mongoose");

const rrSchema = new Mongoose.Schema({
    messageID: {
        type: String,
        required: true
    },
    channelID: {
        type: String,
        required: true
    },
    guildID: {
        type: String,
        required: true
    },
    limit: {
        type: Number,
        required: true
    },
    restrictions: Object,
    reactions: {
        type: Object,
        required: true
    }
});

module.exports = Mongoose.model("rrModel", rrSchema, "REACTION_ROLE_MODELS");