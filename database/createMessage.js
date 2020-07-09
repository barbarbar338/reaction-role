module.exports = async (model, rr) => {
    let exists = await model.findOne({
        messageID: rr.messageID
    });
    if (exists) {
        await model.updateOne({ 
            messageID: rr.messageID
        }, {
            channelID: rr.channelID,
            limit: rr.limit,
            restrictions: rr.restrictions,
            reactions: rr.reactions,
            guildID: rr.guildID
        });
    } else {
        exists = new model(rr);
        await exists.save();
    };
};