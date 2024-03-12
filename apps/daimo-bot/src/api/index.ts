import { PaymentActionProcessor } from "../PaymentActionProcessor";
import dotenv from "dotenv";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { assert } from "@daimo/common";
import express from "express";
import bodyParser from "body-parser";
import { WebhookEvent } from "../types";

dotenv.config();

assert(!!process.env.NEYNAR_API_KEY, "NEYNAR_API_KEY is not defined");
const neynarClient = new NeynarAPIClient(process.env.NEYNAR_API_KEY);

const app = express();
const port = 4000;

app.use(bodyParser.json());
app.get("/", (req, res) => res.send("Up!"));

app.post("/daimobot-hook", async (req, res) => {
  const event: WebhookEvent = req.body;
  console.log(`Received event: ${JSON.stringify(event)}`);

  try {
    if (event.data.object !== "cast") {
      throw new Error(`Unexpected event type: ${event.data.object}`);
    }
    new PaymentActionProcessor(event).process(); // todo do something with it
    res.status(200).send("OK");
  } catch (err) {
    console.error("Error processing webhook event:", err);
    res.status(500).send("Error processing event");
  }
});

app.listen(port, () => console.log(`Server is listening on port ${port}`));
module.exports = app;
