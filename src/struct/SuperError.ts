export class SuperError extends Error {
    constructor(name: string, description: string) {
        super(
            description +
                "\nFOR MORE ADVANCED HELP: https://discord.com/invite/BjEJFwh",
        );
        this.name = name;
    }
}
