import { ReactionRole } from "./src";
const rr = new ReactionRole(
	"NTkwNzk4MTcyNjcwOTE4NjY5.XQndrA.g95aRCp-xaH0fpd0S8LD01YcEtI",
);

const option1 = rr.createOption(
	"👀",
	[
		"832359412664500303", // NORMAL
		"832359427893624852", // PREMIUM
	],
	"normal ve premium rolleri alındı",
	"normal ve premium rolleri bırakıldı",
);

const option2 = rr.createOption(
	"🍉",
	[
		"832359109423661126", // WHITELIST
		"832359071662866442", // BOOSTER
	],
	"whitelist ve booster rolleri alındı",
	"whitelist ve booster rolleri bırakıldı",
);

const option3 = rr.createOption(
	"💩",
	[
		"832359156659781632", // ADMIN
		"832359338362404914", // SUPER ADMIN
	],
	"admin ve super admin rolleri alındı",
	"admin ve super admin rolleri bırakıldı",
);

const option4 = rr.createOption(
	"💎",
	[
		"833416839366705192", // a
		"833416846551547945", // b
	],
	"a ve b rolleri alındı",
	"a ve b rolleri bırakıldı",
);

rr.createMessage(
	"832255195453849610",
	"833413818256064614", // test
	1,
	option1,
	option2,
);

rr.init();

rr.on("message", async (message) => {
	if (message.content === "!test") {
		rr.createMessage(
			"832255195453849610",
			"833416310276358175", // test 2
			2,
			option3,
			option4,
		);
		message.channel.send("ok");
	}
});
