import { ChannelType, TextChannel } from "discord.js";
import { ReactionRole } from "../ReactionRole";
import { IConfig } from "../types";

export const ready = async (client: ReactionRole, now: number) => {
	if (client.logging) client.logger.info(`Logged in as ${client.user?.tag}!`);

	if (client.on_get) {
		client.logger.event("Loading data from database.");

		const saved = (await client.on_get()) as IConfig;
		if (saved) {
			client.logger.info(
				`Importing ${Object.keys(saved).length} messages...`,
			);

			client.importConfig(saved);

			client.logger.success(
				`Successfully imported ${Object.keys(saved).length} messages!`,
			);
		} else client.logger.warning("Database is empty.");
	}

	if (client.logging) {
		client.logger.event("Fetching messages.");
		client.logger.info(
			`Fetching ${Object.keys(client.config).length} messages...`,
		);
	}

	for (const message_id in client.config) {
		const message = client.config[message_id];
		const channel = (await client.channels
			.fetch(message.channel_id)
			.catch(() => undefined)) as TextChannel;

		if (!channel || channel.type != ChannelType.GuildText) {
			client.deleteMessage(message.message_id);
			continue;
		}

		const msg = await channel.messages
			.fetch(message.message_id)
			.catch(() => undefined);

		if (!msg) {
			client.deleteMessage(message.message_id);
			continue;
		}

		for (const clickable of message.clickables) {
			// TODO: Add support for buttons and menus.
			if (
				!msg.reactions.cache.has(clickable.clickable_id) ||
				!msg.reactions.cache
					.get(clickable.clickable_id)
					?.users.cache.has(client.user?.id as string)
			)
				await msg.react(clickable.clickable_id);
		}
	}

	if (client.logging)
		client.logger.success(
			`Successfully fetched ${
				Object.keys(client.config).length
			} messages!`,
		);

	client.ready = true;

	const then = Date.now();

	if (client.logging)
		client.logger.success("Ready 🚀! Took", then - now, "ms");
};
