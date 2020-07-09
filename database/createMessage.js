module.exports = async (model, rr, guildID) => {
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
            guildID
        });
    } else {
        rr.guildID = guildID;
        exists = new model(rr);
        await exists.save();
    };
};