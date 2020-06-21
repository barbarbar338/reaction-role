const ReactionRole = require(".");
const reactionRole = new ReactionRole("NTkwNzk4MTcyNjcwOTE4NjY5.Xu91iA.trM8YH7NpP4umusk8Bpwy-CxONE");

let option1 = reactionRole.createOption("✅", "714542230135767060");
let option2 = reactionRole.createOption("cuteknife:715959996029993009", "717633838616018944");
reactionRole.createMessage("724296760129749014", "717628563813171260", false, option1, option2);

reactionRole.init();