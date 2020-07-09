const SuperError = require("../classes/SuperError");

module.exports = async (self, config) => {
    self.config = self.config.concat(config);
    if (self.client.user) {
        config.forEach(async message => {
            let msg = await self.client.channels.cache.get(message.channelID).messages.fetch(message.messageID).catch(err => {
                throw new SuperError("CanNotFetchMesssage", err.toString());
            });
            if (!msg) throw new SuperError("CanNotFetchMesssage", err.toString());
            message.guildID = msg.guild.id;
            for (let { emoji } of message.reactions) {
                emoji = require("./cleanEmoji")(emoji);
                let messageReaction = msg.reactions.cache.get(emoji);
                if (!messageReaction) await msg.react(emoji).catch((err) => {
                    throw new SuperError("CanNotReactMesssage", err.toString());
                });
                else {
                    if (!messageReaction.me) {
                        messageReaction.users.fetch();
                        await msg.react(emoji).catch((err) => {
                            throw new SuperError("CanNotReactMesssage", err.toString());
                        });
                    };
                };
            };
            if (self.mongoURL) self.database.createMessage(message);
        });
    };
};