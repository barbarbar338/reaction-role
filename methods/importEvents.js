const SuperError = require("../classes/SuperError");

module.exports = async (self) => {
    self.client.on("messageReactionAdd", async(reaction, user) => {
        if (self.client.user.equals(user)) return;
        let member = reaction.message.guild.members.cache.get(user.id);
        
        let cleanEmoji = require("./getEmoji")(reaction.emoji);
        for (let { channelID, reactions, limited } of self.config) {
            if (channelID != reaction.message.channel.id) continue;

            let addRole = [];

            for (let role of member.roles.cache.keys()) addRole.push(role);

            let whitelist = [];
            let blacklist = [];
            
            for (let { emoji, roles } of reactions) {
                if (cleanEmoji == emoji) whitelist.push.apply(whitelist, roles);
                blacklist.push.apply(blacklist, roles);
            };

            if (limited) {
                addRole = addRole.filter((role) => {
                    return !blacklist.includes(role) && !member.roles.cache.has(role);
                });
            }

            addRole.push.apply(addRole, whitelist);

            await member.roles.add(addRole).catch((err) => {
                throw new SuperError("CanNotSetUserRoles", err.toString());
            });

            if (limited) await reaction.users.remove(user.id).catch((err) => {
                throw new SuperError("CanNotRemoveReaction", err.toString());
            });
        };
    });

    self.client.on("messageReactionRemove", async(reaction, user) => {
        if (self.client.user.equals(user)) return;
        let member = reaction.message.guild.members.cache.get(user.id);
        let cleanEmoji = require("./getEmoji")(reaction.emoji);

        for (let { channelID, reactions, limited} of self.config) {
            if (limited) continue;
            if (channelID != reaction.message.channel.id) continue;

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