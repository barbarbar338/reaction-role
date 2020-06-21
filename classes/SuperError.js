module.exports = class SuperError extends Error {
    constructor(name, description) {
        super(description + "\nFOR MORE ADVANCED HELP: https://discord.com/invite/BjEJFwh");
        this.name = name;
    };
};