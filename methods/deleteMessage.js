module.exports = async(self, messageID, channelID) => {
    self.config = self.config.filter(rr => {
        return rr.messageID != messageID;
    });
    if (self.client.user) {
        let message = self.client.channels.cache.get(channelID).messages.cache.get(messageID).reactions.cache.forEach(async reaction => {
            await reaction.users.remove(self.client.user.id).catch((err) => {
                throw new SuperError("CanNotRemoveReaction", err.toString());
            });
        });
        if (self.mongoURL) self.database.deleteMessage(messageID);
    }
}