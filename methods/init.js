const SuperError = require("../classes/SuperError");
module.exports = async (self) => {

    if (self.mongoURL) {
        self.database.once("open", async() => {
            console.info("[ReactionRole] Connected to database");
            await self.client.login(self.token).catch((err) => {
                throw new SuperError("InvalidToken", "Please specify a valid BOT token.");
            });
        });
    } else {
        await self.client.login(self.token).catch((err) => {
            throw new SuperError("InvalidToken", "Please specify a valid BOT token.");
        });
    }

    self.client.on("ready", async () => {
        console.info("[ReactionRole] Fetching messages");

        self.config.forEach(async rr => {
            rr.guildID = self.client.channels.cache.get(rr.channelID).guild.id;
            await self.database.createMessage(rr);
        });
        let savedConfig = await self.rrModel.find();
        self.importConfig(savedConfig);

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
        console.info("[ReactionRole] Fetched messages, system is ready!");
    });
};