module.exports = (master, ...arguments) => {
    let reactions = [];
    for (let i = 3; i < arguments.length; i++) reactions.push(arguments[i]);
    master.config.push({
        "messageID": arguments[0],
        "channelID": arguments[1],
        "limited": arguments[2],
        "reactions": reactions
    });
};