module.exports = (...arguments) => {
    let emoji = arguments[0];
    let roles = [];
    for (let i = 1; i < arguments.length; i++) roles.push(arguments[i]);
    return {
        "emoji": emoji,
        "roles": roles
    };
};