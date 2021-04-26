# Discord ReactionRole client

![totalDownloads](https://img.shields.io/npm/dt/reaction-role?style=for-the-badge)
![weeklyDownloads](https://img.shields.io/npm/dw/reaction-role?style=for-the-badge)
![version](https://img.shields.io/npm/v/reaction-role?style=for-the-badge)
![license](https://img.shields.io/npm/l/reaction-role?style=for-the-badge)
![GitHub stars](https://img.shields.io/github/stars/barbarbar338/reaction-role?style=for-the-badge)

**ReactionRole** is a module that allows you to create Discord reaction role easily!

This module is compatible with all node.js discord wrappers (like discord.js, eris, discord.js-commando etc.)

You also don't need to write any bot code if you want! You can also use this module alone. You just need a Discord Bot Token!

Database support and TypeScript definitions are built-in

# IMPORTANT NOTE

---

You have to turn on "Server Members Intent" option to use this package properly.
![ReactionRoleWarningImage](https://raw.githubusercontent.com/barbarbar338/lib/master/personal_page/images/reaction-role-warning.png)

# Usage

Simple example:

```js
const { ReactionRole } = require("reaction-role");
const system = new ReactionRole("YOUR_BOT_TOKEN");

// use a mongodb uri if you want persistent messages
const system = new ReactionRole("YOUR_BOT_TOKEN", "MONGODB_URI");

// create simple option
const option1 = system.createOption("emoji", ["role_id", "role_id"]);

// create option with messages
const option2 = system.createOption(
	"emoji",
	["role_id"],
	"You got a role", // add message
	"removed role", // remove message
);

// create message
system.createMessage(
	"channel_id",
	"message_id",
	1, // reaction limit
	option1,
	option2,
);

system.init();
```

Creating new messages:

```js
const { ReactionRole } = require("reaction-role");
const client = new ReactionRole("YOUR_BOT_TOKEN");

// use a mongodb uri if you want persistent messages
const client = new ReactionRole("YOUR_BOT_TOKEN", "MONGODB_URI");

// create simple option
const option1 = client.createOption("emoji", ["role_id", "role_id"]);

// create option with messages
const option2 = client.createOption(
	"emoji",
	["role_id"],
	"You got a role", // add message
	"removed role", // remove message
);

// create message
client.createMessage(
	"channel_id",
	"message_id",
	1, // reaction limit
	option1,
	option2,
);

client.init();

client.on("message", (message) => {
	if (message.content == "!create") {
		// create simple option
		const new_option = client.createOption("emoji", ["role_id", "role_id"]);

		// create option with messages
		const new_option_2 = client.createOption(
			"emoji",
			["role_id"],
			"You got a role", // add message
			"removed role", // remove message
		);

		// create message
		client.createMessage(
			"channel_id",
			"message_id",
			1, // reaction limit
			new_option,
			new_option_2,
		);
	}
});
```

# Using Custom Databases

You can change get, save and delete events of system with `<ReactionRole>.onGet(TOnGetFN)`, `<ReactionRole>.onSet(TOnSetFN)` and `<ReactionRole>.onDelete(TOnDeleteFN)` methods. Here is an example with `quick.db`:

```js
const { ReactionRole } = require("reaction-role");
const system = new ReactionRole("YOUR_BOT_TOKEN");

// SETTING CUSTOM DATABASE START
const db = require("quick.db");
system
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

// NORMAL REACTION-ROLE CODE
const option1 = system.createOption("emoji", ["role_id", "role_id"]);

// create option with messages
const option2 = system.createOption(
	"emoji",
	["role_id"],
	"You got a role", // add message
	"removed role", // remove message
);

// create message
system.createMessage(
	"channel_id",
	"message_id",
	1, // reaction limit
	option1,
	option2,
);

system.init();
```

# Useful Links

-   Discord: https://bariscodes.me/discord
-   Github: https://github.com/barbarbar338/reaction-role/
-   NPM: https://www.npmjs.com/package/reaction-role

# [Contact Me For More Help](https://bariscodes.me/discord)

\ ゜ o ゜)ノ
