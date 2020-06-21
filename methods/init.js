const SuperError = require("../classes/SuperError");
module.exports = async (self) => {
    await self.client.login(self.token).catch((err) => {
        throw new SuperError("InvalidToken", "Please specify a valid BOT token.");
    });

    self.client.on("ready", async() => {
        console.log("[ReactionRole] Fetching messages");

        for (let { channelID, messageID, reactions } of self.config) {
            let message = await self.client.channels.cache.get(channelID).messages.fetch(messageID).catch(err => {
                throw new SuperError("CanNotFetchMesssage", err.toString());
            });
            if (!message) continue;

            for (let { emoji } of reactions) {
                emoji = require("./cleanEmoji")(emoji);
                let messageReaction = message.reactions.cache.get(emoji);
                if (!messageReaction) await message.react(emoji).catch((err) => {
                        throw new SuperError("CanNotReactMesssage", err.toString());
                    });
                else {
                    if (!messageReaction.me) {
                        messageReaction.users.fetch();
                        await message.react(emoji).catch((err) => {
                            throw new SuperError("CanNotReactMesssage", err.toString());
                        });
                    };
                };
			};
        };
        await require("./importEvents")(self);
        console.log("[ReactionRole] Fetched messages, system is ready!");
    });
};