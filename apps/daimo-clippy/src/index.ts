import { App } from "@slack/bolt";

import { handleCommand } from "./handlers";

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
});

app.event("app_mention", async ({ event, say }) => {
  const { text } = event;
  const response = await handleCommand(text);
  await say(response);
});

(async () => {
  await app.start(process.env.PORT || 4200);

  console.log("⚡️ Slackbot is running!");
})();
