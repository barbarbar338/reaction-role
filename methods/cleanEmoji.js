const regEx = /[A-Za-z0-9_]+:[0-9]+/;

module.exports = (emoji) => {
	let cleaned = regEx.exec(emoji);
	if (cleaned) return cleaned[0];
	return emoji;
};