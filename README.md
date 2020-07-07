Discord ReactionRole System
=================

![totalDownloads](https://img.shields.io/npm/dt/reaction-role?style=for-the-badge)
![weeklyDownloads](https://img.shields.io/npm/dw/reaction-role?style=for-the-badge)
![version](https://img.shields.io/npm/v/reaction-role?style=for-the-badge)
![nodeVersion](https://img.shields.io/node/v/reaction-role?style=for-the-badge)
![license](https://img.shields.io/npm/l/reaction-role?style=for-the-badge)
![GitHub stars](https://img.shields.io/github/stars/barbarbar338/reaction-role?style=for-the-badge)


<p><b>ReactionRole</b> is a module that allows you to create Discord reaction role easily!</p>
<p>This module is compatible with all node.js discord wrappers (like discord.js, eris, discord.js-commando etc.)</p>
<p>You also don't need to write any bot code if you want! You can also use this module alone. You just need a Discord Bot Token!</p>

<b>[Discord: https://discord.com/invite/BjEJFwh](https://discord.com/invite/BjEJFwh)</b>
-------

<b>[Docs: https://reactionrole.bariscodes.me/](https://reactionrole.bariscodes.me/)</b>
-------

<b>[NPM Page](https://www.npmjs.com/package/reaction-role)</b>
-------

Usage
------------
<p>Here is a simple but effective example!</p>

```js
// ReactionRole Packages
const ReactionRole = require("reaction-role");
const system = new ReactionRole("TOKEN");

/**
 * Creating Options
 * 
 * Example: system.createOption(EMOJI, ROLE_ID_1, ROLE_ID_2, ROLE_ID_3 ...);
 * EMOJI: Emoji to be reacted (e.g: "✅", "rifcat:720623460321198152", "a:cat1:720623437466435626")
 * ROLE_ID: ID of the role to be given (e.g: "697809380137107478") (you can add unlimited amount of roles)
 */
let option1 = system.createOption("✅", "697809380137107478");
let option2 = system.createOption("rifcat:720623460321198152", "708355720436777033");
let option3 = system.createOption("a:cat1:720623437466435626", "703908514887761930");

/**
 * Creating Message
 * 
 * Example: system.createMessage(MESSAGE_ID, CHANNEL_ID, LIMIT, RESTRICTIONS, OPTION_1, OPTION_2, OPTION_3 ...);
 * MESSAGE_ID: Message to be reacted (e.g: "727272497157898372")
 * CHANNEL_ID: Channel with the message you specified (e.g "702115562158948432")
 * LIMIT: Role limit that can be taken (e.g 1, 3, 7)
 * RESTRICTIONS: Permissions required to use the system (e.g null, [ "BAN_MEMBERS" ]) (Type "null" to make it public)
 * OPTION: ReactionRole Option (system.createOption(EMOJI, ROLE_ID_1, ROLE_ID_2, ROLE_ID_3 ...)) (you can add unlimited amount of options)
 */
system.createMessage("727272497157898372", "702115562158948432", 2, null, option1, option2, option3);

/* Initializing system */
system.init();

/* ReInitializing system (NOT REQUIRED)*/
system.reInit();
```

<p>It looks so scary right :D Don't worry here is a simpler system</p>

```js
const ReactionRole = require("reaction-role");
const system = new ReactionRole("TOKEN");

let option1 = system.createOption("✅", "697809380137107478");
let option2 = system.createOption("rifcat:720623460321198152", "708355720436777033");
let option3 = system.createOption("a:cat1:720623437466435626", "703908514887761930");

system.createMessage("727272497157898372", "702115562158948432", 2, null, option1, option2, option3);

system.init();
```

<p>It's actually exactly the same stuff just no comment lines :P</p>

[Contact Me For More Help](https://bariscodes.me/discord)
-------------------

\ ゜o゜)ノ
