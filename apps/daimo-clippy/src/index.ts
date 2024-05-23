import { App } from "@slack/bolt";

import { handleCommand } from "./handlers";

//
// Slack App, using Bolt. Subscribes to events (eg, someone used a slash
// command), handles commands.
//
const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
});

app.event("app_mention", async ({ event, say }) => {
  const { text, ts } = event;
  const response = await handleCommand(text);
  await say({
    text: response,
    thread_ts: ts,
  });
});

(async () => {
  const port = Number(process.env.PORT || 4200);
  await app.start(port);

  console.log(`⚡️ Slackbot is running on port ${port}`);
})();
