module.exports = (master, ...arguments) => {
    let reactions = [];
    for (let i = 4; i < arguments.length; i++) reactions.push(arguments[i]);
    master.config.push({
        "messageID": arguments[0],
        "channelID": arguments[1],
        "limit": arguments[2],
        "restrictions": arguments[3],
        "reactions": reactions
    });
};