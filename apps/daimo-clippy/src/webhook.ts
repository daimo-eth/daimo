import { Router } from "express";

import { handleCommand } from "./utils/handlers";

const webhookRouter = Router();

webhookRouter.post("/slack", async (req, res) => {
  try {
    const { token, command, text } = req.body;

    if (!token || !command) {
      throw new Error("Invalid request");
    }

    if (token !== process.env.SLACK_COMMAND_TOKEN) {
      throw new Error("[SLACK-BOT] Token not recognized");
    }

    const responseText = await handleCommand(command, text);

    return res.status(200).json({
      blocks: [{ type: "section", text: { type: "mrkdwn", responseText } }],
    });
  } catch (error) {
    return res.status(500).json({
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text:
              ":x: " + (error as Error)?.message ??
              "An error occured while handling your request",
          },
        },
      ],
    });
  }
});

export default webhookRouter;
