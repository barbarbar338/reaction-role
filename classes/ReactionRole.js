const { Client } = require("discord.js");
const FileManager = require("./FileManager");
const SuperError = require("./SuperError");
const Mongoose = require("mongoose");

module.exports = function ReactionRole(token, mongoURL = null) {
    self = this;

    self.token = token;
    self.mongoURL = mongoURL;
    self.config = [];
    self.client = new Client();
    self.fileManager = FileManager;
    
    if (self.mongoURL) {
        self.rrModel = require("../database/rrModel");

        Mongoose.connect(self.mongoURL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        self.database = Mongoose.connection;

        self.database.on("error", (err) => {
            throw new SuperError("DataBaseError", err.toString());
        });

        self.database.createMessage = async (rr) => await require("../database/createMessage")(self.rrModel, rr);
        self.database.deleteMessage = async (messageID) => await require("../database/deleteMessage")(self.rrModel, messageID);
    }

    self.createOption = (...arguments) => require("../methods/createOption")(...arguments);
    self.createMessage = async(...arguments) => await require("../methods/createMessage")(self, ...arguments);
    self.deleteMessage = async (messageID, channelID) => await require("../methods/deleteMessage")(self, messageID, channelID);
    self.init = async () => await require("../methods/init")(self);
    self.reInit = async () => await require("../methods/reInit")(self);
    self.importConfig = async (config) => await require("../methods/importConfig")(self, config);
    self.exportConfig = (file) => require("../methods/exportConfig")(self, file); 
};