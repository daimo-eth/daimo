import { MergeMessageHubEvent } from "@farcaster/hub-nodejs";
import { trpcClient } from "./trpcClient";
import {
  dollarsToAmount,
  encodeRequestId,
  formatDaimoLink,
  generateRequestId,
} from "@daimo/common";
import { TRPCClient } from "./types";

// 6 cases of Payment request:

// Requesting:
// Case 1: Alice doesn't have FC linked ❌, requests $ from anyone (open-ended post)
//      Action 1: Daimobot responds with a link to register with Farcaster. Alice registers, then Daibot responds with a link to request $
// Case 2: Alice has FC linked ✅, requests $ from anyone (open-ended post)
//      Action 2: Daimobot responses with link that requests $ from anyone to Alice's Daimo address

// Paying:
// Case 3: Alice responds to Bobs post to pay him, Bob doesn't have FC linked ❌
//     Action 3:  Daimobot responds with a link to register with Farcaster. Bob registers, then Daibot responds with a link to request $
//  Case 3a: Alice responds to Bobs post to pay him, Bob doesn't have FC linked ❌ but has ENS linked on FC
//     Action 3a:  Daimobot responds with link that requests $ from anyone to Bob's ENS
// Case 4: Alice responds to Bobs post to pay him, Bob has FC linked ✅
//     Action 4: Daimobot responds with link that requests $ from anyone to Bob's Daimo address

export class PaymentActionProcessor {
  private text: string | null;
  private parentCastId: string | null;
  private parentAuthorFid: number | null;
  private senderFid: number;
  private client: TRPCClient;
  constructor(event: MergeMessageHubEvent) {
    this.text = event.mergeMessageBody.message.data?.castAddBody?.text || null;
    this.parentCastId = ""; // TODO
    this.parentAuthorFid = -1; // TODO
    this.senderFid = -1; // TODO
    this.client = trpcClient;
  }

  async process() {
    if (!this.text?.includes("@daimobot")) return;

    const daimobotCommand = this.tryExtractCommand();
    if (!daimobotCommand) {
      console.log("Did not follow either example above.");
      return;
    }

    // Handle request or payment
    const { action, amount } = daimobotCommand;
    switch (action) {
      case "request": {
        // See if sender has Farcaster linked
        const senderEthAccount =
          await this.client.lookupEthereumAccountByFid.query({
            fid: this.senderFid,
          });
        if (!senderEthAccount) {
          console.log(
            "Sender not registered with Farcaster. Sending a response cast."
          );
          // TODO send a response cast that sender's not registered, with link to register
          return;
        }

        const daimoShareUrl = await this.handleRequest(
          amount,
          senderEthAccount
        );
        // todo post response with daimoShareUrl
        break;
      }
      case "pay": {
        // See if prospective recipient has Farcaster linked
        if (!this.parentAuthorFid) {
          //   TODO handle more gracefully
          throw new Error(
            "No parent author FID found, thus no one to prospectively pay."
          );
        }
        const recipientEthAccount =
          await this.client.lookupEthereumAccountByFid.query({
            fid: this.parentAuthorFid,
          });
        if (!recipientEthAccount) {
          console.log(
            "Recipient not registered with Farcaster. Sending a response cast."
          );
          // TODO send a response cast that recipient's not registered, with link to register
          return;
        }
        const daimoShareUrl = await this.handleRequest(
          amount,
          recipientEthAccount
        );
        // todo post response with payment confirmation
        break;
      }
      default:
        console.log("Unknown command.");
    }
  }

  private tryExtractCommand(): { action: string; amount: number } | null {
    const match = this.text?.match(
      /@daimobot (request|pay) \$([0-9]+(?:\.[0-9]{1,2})?)/
    );
    if (match && match[1] && match[2]) {
      return {
        action: match[1],
        amount: parseFloat(match[2]),
      };
    }
    return null;
  }

  private async handleRequest(
    amount: number,
    requestRecipient: any // TODO type
  ) {
    console.log(`Requesting $${amount}`);
    // handle request
    console.log("Calling trpcClient.createRequestSponsored.mutate");
    const idString = encodeRequestId(generateRequestId());
    const recipient = requestRecipient.addr;

    const txHash = await this.client.createRequestSponsored.mutate({
      recipient,
      idString,
      amount: dollarsToAmount(amount).toString(),
    });
    console.log(`[DAIMOBOT REQUEST] txHash ${txHash}`);
    const daimoShareUrl = formatDaimoLink({
      type: "requestv2",
      id: idString,
      recipient,
      dollars: `${amount}`,
    });
    console.log(`[DAIMOBOT REQUEST] daimoShareUrl ${daimoShareUrl}`);
    return daimoShareUrl;
  }
}
// Farcaster Idiosyncrasy to remember: Timestamps are calculated from Farcaster epoch, not Unix epoch
// https://github.com/farcasterxyz/hub-monorepo/blob/main/packages/hub-nodejs/docs/Utils.md#time
