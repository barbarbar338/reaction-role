/* Discord.js Packages */
const Discord = require("discord.js");
const client = new Discord.Client();

/* Reaction Role Packages */
const ReactionRole = require("./reactionRole.js");
const reactionRole = new ReactionRole(client);

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
  * Example: reactionRole.create("MESSAGE_ID", "CHANNEL_ID", "DISJOINT", option1, option2, option3, ...);
  * MESSAGE_ID must be a Snowflake like "678345974460186651" (a normal channel ID)
  * CHANNEL_ID must be a Snoflake like "675657998907211787" (a normal channel ID)
  * DISJOINT must be a Boolean like "false" or "true"
  * option must be a reactionRole option like "reactionRole.createOption("EMOJI", "ROLE_ID_1", "ROLE_ID_2", "ROLE_ID_3", ...)"
  */
reactionRole.createMessage("678345974460186651", "675657998907211787", false, option1, option2);

/**
  * Initialize The System
  * This line of code runs the whole system
  * Example: reactionRole.init();
  */
reactionRole.init();

/**
  * 24/7 Host System 
  * If you're using "https://glitch.com/" for the hosting you can use this function for 24/7 host your project!
  * Example: reactionRole.host(PORT, HTML_FILE);
  * PORT must be an Integer like "3000" or "8080"
  * HTML_FILE must be a HTML file like "index.html" (not required)
  * Note: If you look at the "/stats" directory you can see the statistics of your bot
  */
reactionRole.host(3000);

/* Logging In */
client.login("NjA5NzAwNTY2MTQyMTU2ODAw.XkhT5g.mrmD95a2A4qYF6YmauRnWGkcsKg");