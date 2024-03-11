import https from "https";
import {
  HubEventType,
  MergeMessageHubEvent,
  SubscribeRequest,
  getSSLHubRpcClient,
} from "@farcaster/hub-nodejs";
import { EventTextProcessor } from "./EventTextProcessor";

const client = getSSLHubRpcClient("nemes.farcaster.xyz:2283"); // TODO set up own hubble https://www.thehubble.xyz/intro/hubble.html
// TODO mock client for testing

async function main() {
  console.log(`Connecting to the gRPC server...`);
  client.$.waitForReady(Date.now() + 5000, async (e) => {
    if (e) {
      console.error(`Failed to connect to the gRPC server:`, e.message);
      process.exit(1);
    } else {
      console.log(`Connected to the gRPC server`);

      const subRequest = SubscribeRequest.create({
        // fromId:
        eventTypes: [HubEventType.MERGE_MESSAGE],
      });
      const subResult = await client.subscribe(subRequest);

      subResult.map((stream) =>
        stream.on("data", (event: MergeMessageHubEvent) => {
          console.log("Received event from the gRPC server,", { event });
          new EventTextProcessor(event).process();
        })
      );

      client.close();
    }
  });
}

main();
