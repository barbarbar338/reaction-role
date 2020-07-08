/*
from BookmanDB: https://www.npmjs.com/package/bookman
*/
const { writeFileSync, mkdirSync, existsSync, readFileSync, createWriteStream } = require("fs");
const SuperError = require("./SuperError");

module.exports = class FileManager {
    static writeFile(r, o) {
        writeFileSync(`./${r}`, JSON.stringify(o, null, 4), (r) => {
            if (r) throw new SuperError("CanNotWriteFile", r.toString());
        });
    }
    static checkFile(file) {
        let r = file.split("/");
        r.length > 1 && (r.pop(), (r = r.join("/")), existsSync(r) || mkdirSync(`./${r}/`, { recursive: !0 }));

        try {
            let t = JSON.parse(readFileSync(`./${file}`, "utf8"));
            t || ((t = []), this.writeFile(file, t));
        } catch (r) {
            try {
                createWriteStream(`./${file}`);
                let r = [];
                this.writeFile(file, r);
            } catch (e) {
                throw new SuperError("CanNotCreateExportFile", e.toString());
            }
        }
    }
}