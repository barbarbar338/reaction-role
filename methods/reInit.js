const { Client } = require("discord.js");

module.exports = (self) => {
    self.client.destroy();
    self.client = new Client();
    require("./init")(self);
}