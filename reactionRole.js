const Discord = require("discord.js");
const express = require("express");
const http = require("http");
const moment = require("moment");
const BaseCollection = require('@discordjs/collection');
const isObject = d => typeof d === 'object' && d !== null;
require("moment-duration-format");
class ReactionRole {
  constructor(client) {
    this.config = [];
    if (typeof client == "string") {
      this.client = new Discord.Client();
      this.client.login(client).catch(err => {
        throw new Error("[ReactionRole] Please specify a VALID Bot token");
      })
    } else if (typeof client == "object") {
      this.client = client;
    } else {
      throw new Error("[ReactionRole] Please specify a Discord.js Client or Bot Token");
    }
  }
  reInit() {
    console.log("[ReactionRole] Fetching Messages");
    (async () => {
      var debug_count_messagesFetched = 0;
      for (var { channel, message: message_id, reactions } of this.config) {
        var message = await this.client.channels.cache.get(channel).messages.fetch(message_id)
          .catch(error => {throw new Error("[ReactionRole] " + error)});
        if (!message) continue;
        debug_count_messagesFetched += 1;
        for (var {emoji} of reactions) {
          emoji = this.cleanEmojiDiscriminator(emoji);
          var messageReaction = message.reactions.cache.get(emoji);
          if (!messageReaction) {
            await message.react(emoji)
              .catch(error => {throw new Error("[ReactionRole] " + error)});
          } else {
            if (!messageReaction.me) {
              messageReaction.fetchUsers();
              await message.react(emoji)
                .catch(error => {throw new Error("[ReactionRole] " + error)});
            }
          }
        }
      }
      console.log(`[ReactionRole] ${debug_count_messagesFetched} messages fetched`);
      console.log("[ReactionRole] System is ready to rock!");  
    })();
  }
  init() {
    this.client.on("ready", () => {
			console.log("[ReactionRole] Fetching Messages");
			(async () => {
				var debug_count_messagesFetched = 0;
				for (var { channel, message: message_id, reactions } of this.config) {
					var message = await this.client.channels.cache.get(channel).messages.fetch(message_id)
						.catch(error => {throw new Error("[ReactionRole] " + error)});
					if (!message) continue;
					debug_count_messagesFetched += 1;
					for (var {emoji} of reactions) {
						emoji = this.cleanEmojiDiscriminator(emoji);
						var messageReaction = message.reactions.cache.get(emoji);
						if (!messageReaction) {
							await message.react(emoji)
								.catch(error => {throw new Error("[ReactionRole] " + error)});
						} else {
							if (!messageReaction.me) {
								messageReaction.fetchUsers();
								await message.react(emoji)
									.catch(error => {throw new Error("[ReactionRole] " + error)});
							}
						}
					}
				}
				console.log(`[ReactionRole] ${debug_count_messagesFetched} messages fetched`);
        console.log("[ReactionRole] System is ready to rock!");  
			})();
		});
    this.client.on("messageReactionAdd", (messageReaction, user) => {
			if (user == this.client.user) return;
			var member = messageReaction.message.guild.members.cache.get(user.id);
			var emojiDiscriminator = this.getEmojiDiscriminator(messageReaction.emoji);
			(async () => {
				for (var { channel, reactions } of this.config) {
					if (channel != messageReaction.message.channel.id) continue;
					var rolesNew = [];
					for(var role of member.roles.cache.keys()){
						rolesNew.push(role);
					}
					var rolesWhitelist = [];
					var rolesBlacklist = [];
					for (var { emoji, roles } of reactions) {
						if (emojiDiscriminator == emoji) {
							rolesWhitelist.push.apply(rolesWhitelist, roles);
						}
						rolesBlacklist.push.apply(rolesBlacklist, roles);
					}
					rolesNew.push.apply(rolesNew, rolesWhitelist);
					await member.roles.add(rolesNew)
						.catch(error => {throw new Error("[ReactionRole] " + error);});
				}
			})();
		});
		this.client.on("messageReactionRemove", (messageReaction, user) => {
			if (user == this.client.user) return;
			var member = messageReaction.message.guild.members.cache.get(user.id);
			var emojiDiscriminator = this.getEmojiDiscriminator(messageReaction.emoji);
			(async () => {
				for (var { channel, reactions } of this.config) {
					if (channel != messageReaction.message.channel.id) continue;
					var rolesToKeep = [];
					var rolesToRemove = [];
					for (var { emoji, roles } of reactions) {
						if (emojiDiscriminator == emoji) {
							rolesToRemove.push.apply(rolesToRemove, roles);
						} else {
							rolesToKeep.push.apply(rolesToKeep, roles);
						}
					}
					rolesToRemove.filter((role) =>
						(!rolesToKeep.includes(role)) &&
						(member.roles.cache.get(role))
					);
					await member.roles.remove(rolesToRemove)
						.catch(error => {throw new Error("[ReactionRole] " + error)});
				}
			})();
		});
  }
  createMessage() {
    let reactions = [];
    for (var i = 2; i < arguments.length; i++) reactions.push(arguments[i]);
    this.config.push({
        "message": arguments[0],
        "channel": arguments[1],
        "reactions": reactions
      });
  }
  getEmojiDiscriminator(emoji) {
    if (emoji.id) {
      return `${emoji.name}:${emoji.id}`;
    } else {
      return emoji.name;
    }
  }
  cleanEmojiDiscriminator(emojiDiscriminator) {
    var regEx = /[A-Za-z0-9_]+:[0-9]+/;
    var cleaned = regEx.exec(emojiDiscriminator);
    if (cleaned) return cleaned[0];
    return emojiDiscriminator;
  }
  createOption() {
    let emoji = arguments[0];
    let roles = [];
    for (var i = 1; i < arguments.length; i++) roles.push(arguments[i]);
    return {
      "emoji": emoji,
      "roles": roles
    }
  }
  host() {
    const app = express();
    const server = app.listen(arguments[0], function () {console.log("[ReactionRole] app listening on port " + server.address().port)});
    setInterval(() => {
      http.get(`http://${process.env.PROJECT_NAME}.glitch.me/`);
    }, 1000 * 60 * 3)
    app.get("/", (req, res) => {
      if(arguments[1]) res.sendFile(arguments[1])
      else res.send(`
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="HandheldFriendly" content="true">
    <meta name="description" content="This project is hosted with ReactionRole">
    <meta name="keywords" content="reaction, reaction role, ractionrole, Reaction, Role, ReactionRole, Reaction Role, ReactionRole Discord, barbar, barbarbar338, barbarbar, baris, baris demirci, demirci, barış, barış demirci, havuc, havuç, discord.js, discordjs">
    <meta name="copyright" content="Barış DEMİRCİ">
    <meta name="author" content="Barış DEMİRCİ">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css" integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous">
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.8.1/css/all.css" integrity="sha384-50oBUHEmvpQ+1lW4y57PTFmhCaXp0ML5d60M1M7uH2+nqUivzIebhndOJK28anvf" crossorigin="anonymous">
  </head>
  <body class="bg-dark">
    <nav class="navbar navbar-expand-lg navbar-dark fixed-top" style="background-color: black;">
      <a class="navbar-brand" href="https://www.is-my.fun/">Barış Demirci</a>
      <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarSupportedContent">
        <ul class="navbar-nav mr-auto">
          <li class="nav-item active">
            <a class="nav-link" href="https://www.npmjs.com/package/reaction-role">ReactionRole</a>
          </li>
          <li class="nav-item active">
            <a class="nav-link" href="https://tkm.is-my.fun/">Rock Paper Scissors</a>
          </li>
          <li class="nav-item active">
            <a class="nav-link" href="https://drawing.is-my.fun/">drawing.is-my.fun</a>
          </li>
          <li class="nav-item active">
            <a class="nav-link" href="https://embed.is-my.fun/">Discord Embed Editor</a>
          </li>
          <li class="nav-item active">
            <a class="nav-link" href="/stats">Stats</a>
          </li>
        </ul>
      </div>
    </nav>
    <title>ReactionRole Host System</title>
    <br><br><br>
    <header class="bg-lightdark text-white">
      <div class="container text-center">
        <h1>This Project Is Hosted With ReactionRole Host System!</h1>
        <p class="lead">ReactionRole is a module that allows you to create reaction role easily! It also has several functions for you to use.</p>
      </div>
    </header>
    <div class="container"><h1 class="text-center"><a href="https://www.is-my.fun/ulas" target="_blank">Contact Me For More Help</a></h1></div>
    <footer class="page-footer font-small blue pt-4">
    <div class="footer-copyright text-center py-3">
        <p class="m-0 text-center text-white">&copy; <script>document.write(new Date().getFullYear());</script> All Rights Reserved | Made with <i class="fas fa-heart" style="color: #da284b"></i> by Barış Demirci</p>
    </div>
    </footer>
    <script src="https://code.jquery.com/jquery-3.4.1.slim.min.js" integrity="sha384-J6qa4849blE2+poT4WnyKhv5vZF5SrPo0iEjwBvKU7imGFAV0wwj1yYfoRSJoZ+n" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js" integrity="sha384-Q6E9RHvbIyZFJoft+2mJbHaEWldlvI9IOYy5n3zV9zzTtmI3UksdQRVvoxMfooAo" crossorigin="anonymous"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.min.js" integrity="sha384-wfSDF2E50Y2D1uUdj0O3uMBJnjuUD4Ih7YwaYd1iqfktj0Uod8GCExl3Og8ifwB6" crossorigin="anonymous"></script>
  </body>
</html>
`);
    });
    this.client.on("ready", () => {
      app.get("/stats", (req, res) => {
        const duration = moment.duration(this.client.uptime).format(" D [d], H [h], m [m], s [s]");
        const members = this.client.guilds.reduce((p, c) => p + c.memberCount, 0);
        const textChannels = this.client.channels.filter(c => c.type === "text").size;
        const voiceChannels = this.client.channels.filter(c => c.type === "voice").size;
        const guilds = this.client.guilds.size;
        res.json({
          servers: guilds,
          members: members,
          text: textChannels,
          voice: voiceChannels,
          uptime: duration,
          memoryUsage: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
          dVersion: Discord.version,
          nVersion: process.version
        });
      });
    });
  }
  createWebhook(webhook_url) {
    if (!webhook_url.includes("discordapp") || !webhook_url.includes("api") || !webhook_url.includes("webhooks")) throw new Error("[ReactionRole] Please specify a valid Discord Webhook URL");
    webhook_url = webhook_url.split("/");
    const hook = new Discord.WebhookClient(webhook_url[5], webhook_url[6]);
    hook.auth = true;
    return hook;
  }
  intervalMessage(webhook, time, message) {
    if (!webhook.auth) throw new Error("[ReactionRole] Please use a ReactionRole Webhook");
    setInterval(() => {
      webhook.send(message)
    }, time);
  }
  Client() {
    return this.client;
  }
}
class Collection extends BaseCollection {
  toJSON() {
    return this.map(e => typeof e.toJSON === 'function' ? e.toJSON() : this.flatten(e));
  }
  static flatten(obj, ...props) {
    if (!isObject(obj)) return obj;
    props = Object.assign(...Object.keys(obj).filter(k => !k.startsWith('_')).map(k => ({ [k]: true })), ...props);
    const out = {};
    for (let [prop, newProp] of Object.entries(props)) {
      if (!newProp) continue;
      newProp = newProp === true ? prop : newProp;
      const element = obj[prop];
      const elemIsObj = isObject(element);
      const valueOf = elemIsObj && typeof element.valueOf === 'function' ? element.valueOf() : null;
      if (element instanceof require('./Collection')) out[newProp] = Array.from(element.keys());
      else if (valueOf instanceof require('./Collection')) out[newProp] = Array.from(valueOf.keys());
      else if (Array.isArray(element)) out[newProp] = element.map(e => this.flatten(e));
      else if (typeof valueOf !== 'object') out[newProp] = valueOf;
      else if (!elemIsObj) out[newProp] = element;
    }
    return out;
  }
}
module.exports = {
  Main: ReactionRole,
  Collection: Collection
};
