# Discord ReactionRole client

![totalDownloads](https://img.shields.io/npm/dt/reaction-role?style=for-the-badge)
![weeklyDownloads](https://img.shields.io/npm/dw/reaction-role?style=for-the-badge)
![version](https://img.shields.io/npm/v/reaction-role?style=for-the-badge)
![license](https://img.shields.io/npm/l/reaction-role?style=for-the-badge)
![GitHub stars](https://img.shields.io/github/stars/barbarbar338/reaction-role?style=for-the-badge)

-   **ReactionRole** is a module that allows you to create Discord reaction role easily!
-   This module is compatible with all node.js discord wrappers (like discord.js, eris, discord.js-commando etc.)
-   You also don't need to write any bot code if you want! You can also use this module alone. You just need a Discord Bot Token!
-   Database support and TypeScript definitions are built-in!

# IMPORTANT NOTE

---

You have to turn on "Server Members Intent" option to use this package properly.
![ReactionRoleWarningImage](https://raw.githubusercontent.com/barbarbar338/lib/master/personal_page/images/reaction-role-warning.png)

# Usage

Simple example:

```js
const { ReactionRole, EType } = require("reaction-role");

const client = new ReactionRole({
	token: "YOUR_BOT_TOKEN",
});

async function bootstrap() {
	const option1 = client.createOption({
		clickable_id: "EMOJI_ID",
		roles: ["ROLE_ID"],
		type: EType.NORMAL,
	});

	const option2 = client.createOption({
		clickable_id: "EMOJI_ID",
		roles: ["ROLE_ID"],
		type: EType.ONCE,
	});

	await client.createMessage({
		channel_id: "CHANNEL_ID",
		clickables: [option1, option2],
		message_id: "MESSAGE_ID",
	});

	client.init();
}

bootstrap();
```

Creating new messages:

```js
client.on("message", (message) => {
	if (message.content == "!create") {
		// you can take any user input and use it to create new option and message

		// create a simple option
		const option = client.createOption({
			clickable_id: "EMOJI_ID",
			roles: ["ROLE_ID"],
			type: EType.NORMAL,
		});

		await client.createMessage({
			channel_id: "CHANNEL_ID",
			clickables: [option],
			message_id: "MESSAGE_ID",
		});

		// and you are done! New message and options are added to system
	}
});
```

# Execute Custom Code

You can execute your own code when a user clicks on a reaction. You can do this by using clickable type `EType.CUSTOM`.

```js
const { ReactionRole, EType } = require("reaction-role");

const client = new ReactionRole({
	token: "YOUR_BOT_TOKEN",
});

async function bootstrap() {
	const option = client.createOption({
		clickable_id: "EMOJI_ID",
		roles: ["ROLE_ID"],

		// These lines are important! everything else is same as normal
		type: EType.CUSTOM,
		onClick: (clickable, member) => {
			console.log(
				member.user.username + " clicked on " + clickable.clickable_id,
			);
		},
		onRemove: (clickable, member) => {
			console.log(
				member.user.username + " removed " + clickable.clickable_id,
			);
		},
	});

	await client.createMessage({
		channel_id: "CHANNEL_ID",
		clickables: [option],
		message_id: "MESSAGE_ID",
	});

	client.init();
}

bootstrap();
```

# Using Custom Databases

You can change get, save and delete events of system with `<ReactionRole>.onGet(TOnGetFN)`, `<ReactionRole>.onSet(TOnSetFN)` and `<ReactionRole>.onDelete(TOnDeleteFN)` methods. Here is an example with `quick.db`:

```js
const { ReactionRole, EType } = require("reaction-role");

const client = new ReactionRole({
	token: "YOUR_BOT_TOKEN",
});

// SETTING CUSTOM DATABASE START
// choose your favourite database module
const db = require("quick.db");

// update save events
client
	.onGet(async () => {
		const saved = (await db.get("reaction_roles")) || {};
		return saved;
	})
	.onSet(async (data) => {
		await db.set("reaction_roles", data);
	})
	.onDelete(async (message_id) => {
		await db.delete(`reaction_roles.${message_id}`);
	});
// SETTING CUSTOM DATABASE END

// ... use it as normal
```

# Useful Links

-   Discord: https://338.rocks/discord
-   Github: https://github.com/barbarbar338/reaction-role/
-   NPM: https://www.npmjs.com/package/reaction-role

# [Contact Me For More Help](https://338.rocks/discord)

\ ゜ o ゜)ノ
