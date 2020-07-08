module.exports = async (model, messageID) => {
    await model.deleteOne({
        messageID
    });
};