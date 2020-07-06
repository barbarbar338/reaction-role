const fs = require("fs");
const SuperError = require("../classes/SuperError");

module.exports = (self, file) => {
    try {
        fs.writeFileSync(file, JSON.stringify(self.config, null, 4));
    } catch (err) {
        throw new SuperError("CanNotWriteFile", err.toString());
    };
};