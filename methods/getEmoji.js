module.exports = (emoji) => {
	if (emoji.id) return `${emoji.name}:${emoji.id}`;
	else return emoji.name;
};