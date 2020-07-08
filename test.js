const ReactionRole = require(".");
const system = new ReactionRole("token");

/*let option1 = system.createOption("✅", "697809380137107478");
let option2 = system.createOption("rifcat:720623460321198152", "708355720436777033");
let option3 = system.createOption("cat1:720623437466435626", "703908514887761930");

system.createMessage("727272497157898372", "702115562158948432", 2, null, option1, option2, option3);*/

system.client.on("message", async(message) => {
    if (message.content != "deleteMessage") return;
    await system.deleteMessage("730417962590404699", "702115562158948432");
    message.channel.send("ok");
    
});

system.init();