import * as bodyParser from "body-parser";
import * as dotenv from "dotenv";
import express, { Request, Response } from "express";

import { DaimobotProcessor } from "./PaymentActionProcessor";
import { WebhookEvent } from "./types";

dotenv.config();

const app = express();
const port = 4000;

app.use(bodyParser.json());
app.get("/health", (req: Request, res: Response) => res.send("Up!"));

app.post("/daimobot-hook", async (req: Request, res: Response) => {
  const event: WebhookEvent = req.body;
  console.log(`Received event: ${JSON.stringify(event, null, 2)}`);

  try {
    if (event.data.object !== "cast") {
      throw new Error(`Unexpected event type: ${event.data.object}`);
    }
    new DaimobotProcessor(event).process();
    res.status(200).send("OK");
  } catch (err) {
    console.error("Error processing webhook event:", err);
    // TODO log to o11y provider
    res.status(500).send("Error processing event");
  }
});

app.listen(port, () => console.log(`Server is listening on port ${port}`));
module.exports = app;
