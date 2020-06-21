const { Client } = require("discord.js");
const SuperError = require("./SuperError");

module.exports = function ReactionRole(token) {
    self = this;

    self.token = token;
    self.config = [];
    self.client = new Client();
    
    self.createOption = (...arguments) => require("../methods/createOption")(...arguments);
    self.createMessage = (...arguments) => require("../methods/createMessage")(self, ...arguments);
    self.init = async () => await require("../methods/init")(self);
    self.reInit = async () => await require("../methods/reInit")(self);
};