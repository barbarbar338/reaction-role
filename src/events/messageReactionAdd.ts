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

export const messageReactionAdd = async (
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
	const member = reaction.message.guild?.members.cache.get(
		user.id,
	) as GuildMember;

	if (message.limit && message.limit > 0) {
		const reactions = reaction.message.reactions.cache.filter(
			(r) =>
				message.clickables.some(
					(clickable) =>
						clickable.clickable_id == (r.emoji.id || r.emoji.name),
				) && r.users.cache.has(user.id),
		);

		if (reactions.size > message.limit) {
			await reaction.users.remove(user.id);

			return;
		}
	}

	const roles = clickable.roles.filter((id) =>
		clickable.type == EType.REMOVE
			? member.roles.cache.has(id)
			: !member.roles.cache.has(id),
	);
	if (roles.length < 1) return;

	switch (clickable.type) {
		case EType.NORMAL:
			await member.roles.add(roles);
			break;
		case EType.ONCE:
			await member.roles.add(roles);
			await reaction.users.remove(member.id);
			break;
		case EType.REMOVE:
			await member.roles.remove(roles);
			break;
		case EType.CUSTOM:
			await member.roles.add(roles);
			if (clickable.onClick) {
				const fn = parseFunction(
					clickable.onClick as unknown as string,
				);
				fn(clickable, member);
			}
	}

	if (clickable.add_message)
		await member.send(clickable.add_message).catch(() => undefined);
};
