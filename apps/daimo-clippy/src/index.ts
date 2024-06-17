import { App } from "@slack/bolt";

import { handleCommand } from "./handlers";

const readline = require("readline/promises");

//
// Slack App, using Bolt. Subscribes to events (eg, someone used a slash
// command), handles commands.
//
const app = new App({
  customRoutes: [
    {
      path: "/health",
      method: ["GET"],
      handler: (req, res) => {
        res.writeHead(200);
        res.end("Up!");
      },
    },
  ],
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

  // For faster development, test locally:
  console.log(`To test @Clippy locally, enter commands below:`);
  const { stdin: input, stdout: output } = process;
  const rl = readline.createInterface({ input, output });
  while (true) {
    const input = (await rl.question("@Clippy ")).trim();
    if (input === "") continue;
    try {
      const response = await handleCommand(`<@U0610TSAFAR> ${input}`);
      console.log(response);
    } catch (e) {
      console.log(e);
    }
  }
})();
