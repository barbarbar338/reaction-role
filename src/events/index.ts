import { ReactionRole } from "../ReactionRole";
import { messageReactionAdd } from "./messageReactionAdd";
import { messageReactionRemove } from "./messageReactionRemove";
import { ready } from "./ready";

export const handleEvents = (client: ReactionRole) => {
	const now = Date.now();

	client.on("ready", async () => ready(client, now));
	client.on("messageReactionAdd", async (reaction, user) =>
		messageReactionAdd(client, reaction, user),
	);
	client.on("messageReactionRemove", async (reaction, user) =>
		messageReactionRemove(client, reaction, user),
	);
};
