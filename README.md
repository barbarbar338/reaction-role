Discord ReactionRole System
=================

<p><b>ReactionRole</b> is a module that allows you to create Discord reaction role easily! It also has several functions for you to use.</p>
<p>This module is compatible with all node.js discord modules (like discord.js, eris, discord.js-commando etc.)</p>
<p>You also don't need to write any bot code if you want! You can also use this module alone. You just need a Discord Bot Token!</p>

<b>[Discord: https://discord.com/invite/BjEJFwh](https://discord.com/invite/BjEJFwh)</b>
-------

<b>[NPM Page](https://www.npmjs.com/package/reaction-role)</b>
-------

Usage
------------
<p>Here is a simple but effective example! (if you are using discord.js)</p>

```js
/* Discord.js Packages */
const Discord = require("discord.js");
const client = new Discord.Client();

/* Reaction Role Packages */
const ReactionRole = require("reaction-role");
const reactionRole = new ReactionRole("TOKEN");

/**
  * Creating Options 
  * You can add unlimited amounts of role ID's
  * Example: let option = reactionRole.createOption("EMOJI", "ROLE_ID_1", "ROLE_ID_2", "ROLE_ID_3", ...);
  * EMOJI must be a normal emoji like "✅" or custom emoji like "spotify:598532266515496970"
  * ROLE_ID must be a Snowflake like "606046163564494859" (a normal role ID)
  */
let option1 = reactionRole.createOption("✅", "606046163564494859", "604212225493696512");
let option2 = reactionRole.createOption("spotify:598532266515496970", "604212225493696512", "606046163564494859");

/**
  * Creating New Reaction Role Message 
  * You can add unlimited amounts of option
  * Example: reactionRole.create("MESSAGE_ID", "CHANNEL_ID", limited?, option1, option2, option3, ...);
  * MESSAGE_ID must be a Snowflake like "678345974460186651" (a normal channel ID)
  * CHANNEL_ID must be a Snoflake like "675657998907211787" (a normal channel ID)
  * limited? must be a boolean like true or false
  * option must be a reactionRole option like "reactionRole.createOption("EMOJI", "ROLE_ID_1", "ROLE_ID_2", "ROLE_ID_3", ...)"
  */
reactionRole.createMessage("678345974460186651", "675657998907211787", true, option1, option2);

/**
  * Initialize The System
  * This line of code runs the whole system
  * Example: reactionRole.init();
  */
reactionRole.init();

/**
  * ReInitialize The System
  * This line of code runs the whole system
  * Example: reactionRole.init();
  */
reactionRole.reInit();
```

<p>It looks so scary right :D Don't worry here is a simpler system</p>

```js
const ReactionRole = require("reaction-role");
const reactionRole = new ReactionRole("TOKEN");

let option1 = reactionRole.createOption("✅", "606046163564494859", "604212225493696512");
let option2 = reactionRole.createOption("spotify:598532266515496970", "604212225493696512", "606046163564494859");
reactionRole.createMessage("678345974460186651", "675657998907211787", true, option1, option2);

reactionRole.init();
```

<p>It's actually exactly the same stuff just no comment lines :P</p>

[Contact Me For More Help](https://bariscodes.me/discord)
-------------------

\ ゜o゜)ノ
