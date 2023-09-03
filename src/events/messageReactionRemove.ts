import {
	GuildMember,
	MessageReaction,
	PartialMessageReaction,
	PartialUser,
	User,
} from "discord.js";
import { get, has } from "lodash";
import { ReactionRole } from "../ReactionRole";
import { EComponentType, EType } from "../types";
import { parseFunction } from "../utils";

export const messageReactionRemove = async (
	client: ReactionRole,
	reaction: MessageReaction | PartialMessageReaction,
	user: User | PartialUser,
) => {
	if (!client.ready) return;

	if (reaction.partial) reaction = await reaction.fetch();
	if (!reaction.message.guild) return;
	if (user.partial) user = await user.fetch();
	if (!reaction.message.guild.members.cache.has(user.id)) return;
	if (!has(client.config, reaction.message.id)) return;

	const message = get(client.config, reaction.message.id);

	if (message.type != EComponentType.REACTION) return;

	const clickable = message.clickables.find(
		(clickable) =>
			clickable.clickable_id ==
			(reaction.emoji.id || reaction.emoji.name),
	);
	if (!clickable) return;

	// We are cancelling the operation because in ONCE type clickable components, reaction is automatically removed.
	// That's why reaction remove event is triggered and role should not be removed again.
	if (clickable.type == EType.ONCE) return;

	const member = reaction.message.guild?.members.cache.get(
		user.id,
	) as GuildMember;
	const roles = clickable.roles.filter((id) =>
		clickable.type == EType.REMOVE
			? !member.roles.cache.has(id)
			: member.roles.cache.has(id),
	);

	if (roles.length < 1) return;

	switch (clickable.type) {
		case EType.NORMAL:
			await member.roles.remove(roles);
			break;
		case EType.REMOVE:
			await member.roles.add(roles);
			break;
		case EType.CUSTOM:
			await member.roles.remove(roles);
			if (clickable.onRemove) {
				const fn = parseFunction(
					clickable.onRemove as unknown as string,
				);
				fn(clickable, member);
			}
	}

	if (clickable.remove_message)
		await member.send(clickable.remove_message).catch(() => undefined);
};
