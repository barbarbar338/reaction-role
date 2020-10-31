Discord ReactionRole System
=================
![totalDownloads](https://img.shields.io/npm/dt/reaction-role?style=for-the-badge)
![weeklyDownloads](https://img.shields.io/npm/dw/reaction-role?style=for-the-badge)
![version](https://img.shields.io/npm/v/reaction-role?style=for-the-badge)
![license](https://img.shields.io/npm/l/reaction-role?style=for-the-badge)
![GitHub stars](https://img.shields.io/github/stars/barbarbar338/reaction-role?style=for-the-badge)

**ReactionRole** is a module that allows you to create Discord reaction role easily!

This module is compatible with all node.js discord wrappers (like discord.js, eris, discord.js-commando etc.)

You also don't need to write any bot code if you want! You can also use this module alone. You just need a Discord Bot Token!

# IMPORTANT NOTE
---
You have to turn on "Server Members Intent" option to use this package properly.
![ReactionRoleWarningImage](https://raw.githubusercontent.com/barbarbar338/lib/master/personal_page/images/reaction-role-warning.png)

[Usage](https://reactionrole.bariscodes.me/)
------------
See [documentation](https://reactionrole.bariscodes.me/) for detailed information!

```js
const ReactionRole = require("reaction-role");
const system = new ReactionRole("DISCORD_BOT_TOKEN");

const option1 = system.createOption("EMOJI", "ADD_MESSAGE", "REMOVE_MESSAGE", [ "ROLE_TO_ADD_ID" ], [ "ROLE_TO_REMOVE_ID" ]);
const option2 = system.createOption("EMOJI", "ADD_MESSAGE", "REMOVE_MESSAGE", [ "ROLE_TO_ADD_ID" ], [ "ROLE_TO_REMOVE_ID" ]);
const option3 = system.createOption("EMOJI", "ADD_MESSAGE", "REMOVE_MESSAGE", [ "ROLE_TO_ADD_ID" ], [ "ROLE_TO_REMOVE_ID" ]);

const LIMIT = 3;
const RESTRICTIONS = [];

system.createMessage("MESSAGE_ID", "CHANNEL_ID", LIMIT, RESTRICTIONS, option1, option2, option3);

system.init();
```

Useful Links
------
- Discord: https://bariscodes.me/discord
- Github: https://github.com/barbarbar338/reaction-role/
- NPM: https://www.npmjs.com/package/reaction-role
- Docs: https://reactionrole.bariscodes.me/

[Contact Me For More Help](https://bariscodes.me/discord)
-------------------

\ ゜o゜)ノ