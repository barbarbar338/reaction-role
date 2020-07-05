const ReactionRole = require(".");
const reactionRole = new ReactionRole("TOKEN");

let option1 = reactionRole.createOption("✅", "697809380137107478");
let option2 = reactionRole.createOption("rifcat:720623460321198152", "708355720436777033");
let option3 = reactionRole.createOption("cat1:720623437466435626", "703908514887761930");

reactionRole.createMessage("727272497157898372", "702115562158948432", 2, null, option1, option2, option3);

reactionRole.init();