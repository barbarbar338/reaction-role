const { Client } = require("discord.js");

module.exports = async (self) => {
    console.info("[ReactionRole] ReInitializing System!");
    self.client.destroy();
    self.client = new Client();
    await require("./init")(self);
}