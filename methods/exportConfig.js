module.exports = (self, file) => {
    self.fileManager.checkFile(file);
    self.fileManager.writeFile(file, self.config);
    return self.config;
};