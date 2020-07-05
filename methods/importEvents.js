const SuperError = require("../classes/SuperError");

module.exports = async (self) => {
    self.client.on("messageReactionAdd", async (reaction, user) => {
        if (self.client.user.equals(user)) return;
        let member = reaction.message.guild.members.cache.get(user.id);
        if (!member) return;

        let cleanEmoji = require("./getEmoji")(reaction.emoji);

        for (let { messageID, channelID, reactions, limit, restrictions } of self.config) {
            if (channelID != reaction.message.channel.id) continue;
            if (messageID != reaction.message.id) continue;
            if (restrictions && member.permissions.has(restrictions)) {
                console.log(restrictions)
                await reaction.users.remove(user.id).catch((err) => {
                    throw new SuperError("CanNotRemoveReaction", err.toString());
                });
                continue;
            };

            let addRole = [];

            for (let role of member.roles.cache.keys()) addRole.push(role);

            let whitelist = [];
            let blacklist = [];

            for (let { emoji, roles } of reactions) {
                if (cleanEmoji == emoji) whitelist.push.apply(whitelist, roles);
                else blacklist.push.apply(blacklist, roles);
            };

            let configEmojis = reactions.map(r => {
                return r.emoji
            });

            let reactionSize = reaction.message.reactions.cache
                .filter(r => {
                    return configEmojis.includes(require("./getEmoji")(r.emoji));
                })
                .filter(r => {
                    return r.users.cache.has(user.id);
                }).size;

            if (reactionSize > limit) {
                await reaction.users.remove(user.id).catch((err) => {
                    throw new SuperError("CanNotRemoveReaction", err.toString());
                });
                continue;
            };

            addRole.push.apply(addRole, whitelist);

            await member.roles.add(addRole).catch((err) => {
                throw new SuperError("CanNotSetUserRoles", err.toString());
            });

        };
    });

    self.client.on("messageReactionRemove", async (reaction, user) => {
        if (self.client.user.equals(user)) return;
        let member = reaction.message.guild.members.cache.get(user.id);
        let cleanEmoji = require("./getEmoji")(reaction.emoji);

        for (let { messageID, channelID, reactions } of self.config) {
            if (channelID != reaction.message.channel.id) continue;
            if (messageID != reaction.message.id) continue;

            let keep = [];
            let remove = [];

            for (let { emoji, roles } of reactions) {
                if (cleanEmoji == emoji) remove.push.apply(remove, roles);
                else keep.push.apply(keep, roles);
            };

            remove.filter((role) => {
                return !keep.includes(role) && member.roles.cache.has(role);
            });

            await member.roles.remove(remove).catch((err) => {
                throw new SuperError("CanNotRemoveRole", err.toString());
            });

        };
    });
};