// special thanks to https://stackoverflow.com/a/36517369/10124281

export const stringifyFunction = (fn: Function): string =>
	`/Function(${fn.toString()})/`;

export const parseFunction = (str: string): Function => {
	const value = str.substring(10, str.length - 2);
	return (0, eval)("(" + value + ")");
};
