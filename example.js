/* Discord.js Packages */
const Discord = require("discord.js");
const client = new Discord.Client();

/* Reaction Role Packages */
const ReactionRole = require("reaction-role");
const reactionRole = new ReactionRole.Main(client);

/**
 * Exporting Client
 * You can export your bot client with these line of codes lol
 * Example: const bot = reactionRole.Client();
 */
const bot = reactionRole.Client();

/*
 * Creating Collections
 * You can create colections and save datas to them xd
 * Example: const collection = new ReactionRole.Collection();
 * You can set datas like "collection.set("data_name", "data_value")"
 * You can use your data like "collection.get("data_name")" => this code returns the value of "data_name" data
 */
const collection = new ReactionRole.Collection();
collection.set("ReactionRole", "https://www.npmjs.com/package/reaction-role")
console.log(collection.get("ReactionRole")) // => https://www.npmjs.com/package/reaction-role

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
  * Example: reactionRole.create("MESSAGE_ID", "CHANNEL_ID", option1, option2, option3, ...);
  * MESSAGE_ID must be a Snowflake like "678345974460186651" (a normal channel ID)
  * CHANNEL_ID must be a Snoflake like "675657998907211787" (a normal channel ID)
  * option must be a reactionRole option like "reactionRole.createOption("EMOJI", "ROLE_ID_1", "ROLE_ID_2", "ROLE_ID_3", ...)"
  */
reactionRole.createMessage("686872385973911552", "675657998907211787", option1, option2);

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

/**
  * 24/7 Host System (You don't have to use this line of code)
  * If you're using "https://glitch.com/" for the hosting you can use this function for 24/7 host your project!
  * Example: reactionRole.host(PORT, HTML_FILE);
  * PORT must be an Integer like "3000" or "8080"
  * HTML_FILE must be a HTML file like "index.html" (not required)
  * Note: If you look at the "/stats" directory you can see the statistics of your bot
  */
reactionRole.host(3000);

/**
  * Webhook Creator (You don't have to use this line of code)
  * Creates Webhook with specified Webhook URL
  * Example: reactionRole.createWebhook("WEBHOOK_URL");
  * WEBHOOK_URL must be a Discord Webhook URL
  * Note: You can use Webhooks like Channel (https://discord.js.org/#/docs/main/stable/class/Channel)
  * Which means you can use webhooks like "webhook.send("MESSAGE");"
  */
let hook = reactionRole.createWebhook("https://discordapp.com/api/webhooks/678330133819555865/T9li3ESR7yJuzjv8tltrUEdZINlk5M1Dhl0u7dwLhB1PkHH_YQV90dNOS3WI5JhQ9LrY");

/**
  * Message Interval Creator (You don't have to use this line of code)
  * Sends the message you specified to the webhook you specified within the specified time
  * Example: reactionRole.intervalMessage(WEBHOOK, TIME, MESSAGE)
  * WEBHOOK must be a ReactionRole Webhook (reactionRole.createWebhook("WEBHOOK_URL"))
  * TIME must be a Bit Time like 1000 * 60 * 30 = 30 minutes (ms * s * m * h * d * w)
  * MESSAGE must be a string like "Hello world!" or an embed like "embed: { description: "Hello world!" }"
  */
//reactionRole.intervalMessage(hook, 1000*3, "lol")

/* Logging In */
client.login("TOKEN");