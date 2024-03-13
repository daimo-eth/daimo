import {
  EAccount,
  assert,
  dollarsToAmount,
  encodeRequestId,
  formatDaimoLink,
  generateRequestId,
} from "@daimo/common";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import {
  CONNECT_FC_MESSAGE,
  PAYMENT_CONNECT_FC_MESSAGE,
  REQUEST_PAYMENT_MESSAGE,
} from "./botResponses";
import { trpcClient } from "./trpcClient";
import { SendCastOptions, TRPCClient, WebhookEvent } from "./types";

// 4 cases of Payment request:

// Requesting:
// Case 1: Alice doesn't have FC linked ❌, requests $ from anyone (open-ended post)
//      Action 1: Daimobot responds with a link to register with Farcaster. Alice registers, then Daimobot responds with a link to request $
//  Case 1a: Alice doesn't have FC linked ❌ but has ENS linked on FC, requests $ from anyone
//     Action 1a:  Daimobot responds with link that requests $ from anyone to Alice's ENS
// Case 2: Alice has FC linked ✅, requests $ from anyone
//      Action 2: Daimobot responses with link that requests $ from anyone to Alice's Daimo address

// Paying:
// Case 3: Alice responds to Bobs post to pay him, Bob doesn't have FC linked ❌
//     Action 3:  Daimobot responds with a link to register with Farcaster. Bob registers, then Daimobot responds with a link to request $
//  Case 3a: Alice responds to Bobs post to pay him, Bob doesn't have FC linked ❌ but has ENS linked on FC
//     Action 3a:  Daimobot responds with link that requests $ from anyone to Bob's ENS
// Case 4: Alice responds to Bobs post to pay him, Bob has FC linked ✅
//     Action 4: Daimobot responds with link that requests $ from anyone to Bob's Daimo address

assert(!!process.env.NEYNAR_API_KEY, "NEYNAR_API_KEY is not defined");
const _neynarClient = new NeynarAPIClient(process.env.NEYNAR_API_KEY);

assert(
  !!process.env.DAIMOBOT_SIGNER_UUID,
  "DAIMOBOT_SIGNER_UUID is not defined"
);
const DAIMOBOT_SIGNER_UUID = process.env.DAIMOBOT_SIGNER_UUID;

export class PaymentActionProcessor {
  private text: string;
  private castId: string;
  private senderFid: number;
  private authorUsername: string;
  private parentAuthorFid: number | null;
  private trpcClient: TRPCClient;
  private neynarClient: NeynarAPIClient;

  constructor(
    event: WebhookEvent,
    trpc: TRPCClient = trpcClient,
    neynarClient: NeynarAPIClient = _neynarClient
  ) {
    const { data } = event;
    this.text = data.text;
    this.castId = data.hash;
    this.authorUsername = data.author.username;
    this.parentAuthorFid = data.parent_author.fid;
    this.senderFid = data.author.fid;

    this.trpcClient = trpc;
    this.neynarClient = neynarClient;
  }

  async process() {
    if (!this.text?.includes("@daimobot")) return;

    const daimobotCommand = this._tryExtractCommand();
    if (!daimobotCommand) {
      console.log("Cast follows neither request nor pay format.");
      this.publishCastReply(
        "Hi! To use me, please use the format `@daimobot request $<amount>` or `@daimobot pay $<amount>`."
      );
      return;
    }

    const { action, cleanedAmount } = daimobotCommand;
    switch (action) {
      case "request": {
        // See if sender has Farcaster linked
        const senderEthAccount =
          await this.trpcClient.lookupEthereumAccountByFid.query({
            fid: this.senderFid,
          });
        if (!senderEthAccount) {
          // TODO check ENS here
          console.log(
            "Sender not registered with Farcaster. Sending a response cast."
          );
          this.publishCastReply(
            CONNECT_FC_MESSAGE
            // TODO if there's a convenience url to connect Farcaster, add here
          );
          return;
        }

        const daimoShareUrl = await this.handleRequest(
          cleanedAmount,
          senderEthAccount
        );
        this.publishCastReply(
          REQUEST_PAYMENT_MESSAGE(cleanedAmount, this.authorUsername),
          {
            embeds: [{ url: daimoShareUrl }],
          }
        );
        break;
      }
      case "pay": {
        // See if prospective recipient has Farcaster linked
        if (!this.parentAuthorFid) {
          console.warn(
            "No parent author FID found, thus no one to prospectively pay."
          );
          this.publishCastReply(
            "I can't find who you're trying to pay 🧐 \n\n To pay someone, make sure you're replying to one of their casts!"
          );
          return;
        }
        const recipientEthAccount =
          await this.trpcClient.lookupEthereumAccountByFid.query({
            fid: this.parentAuthorFid,
          });
        const recipientUsername = await this.getFcUsernameByFid(
          this.parentAuthorFid
        );
        if (!recipientEthAccount) {
          // TODO check ENS here

          console.log(
            "Recipient not registered with Farcaster. Sending a response cast."
          );
          this.publishCastReply(
            PAYMENT_CONNECT_FC_MESSAGE(recipientUsername)
            // TODO if there's a convenience url to connect Farcaster, add here
          );
          return;
        }
        const daimoShareUrl = await this.handleRequest(
          cleanedAmount,
          recipientEthAccount
        );

        this.publishCastReply(
          REQUEST_PAYMENT_MESSAGE(cleanedAmount, recipientUsername),
          {
            embeds: [{ url: daimoShareUrl }],
          }
        );
        break;
      }
      default:
        console.log("Unknown command.");
    }
  }

  _tryExtractCommand(): {
    action: string;
    cleanedAmount: number;
  } | null {
    const match = this.text?.match(
      /@daimobot (request|pay) \$([0-9]+(?:\.[0-9]{1,2})?)/
    );
    console.log(`[DAIMOBOT REQUEST] match: ${JSON.stringify(match)}`);
    if (match && match[1] && match[2]) {
      const cleanedAmount = parseFloat(parseFloat(match[2]).toFixed(2));
      return {
        action: match[1],
        cleanedAmount,
      };
    }
    return null;
  }

  private async handleRequest(amount: number, requestRecipient: EAccount) {
    const idString = encodeRequestId(generateRequestId());
    const recipient = requestRecipient.addr;

    const params = {
      recipient,
      idString,
      amount: dollarsToAmount(amount).toString(),
    };
    console.log(
      `Calling trpcClient.createRequestSponsored.mutate with params: ${JSON.stringify(
        params
      )}`
    );
    const txHash = await this.trpcClient.createRequestSponsored.mutate(params);
    console.log(`[DAIMOBOT REQUEST] txHash ${txHash}`);
    const daimoShareUrl = formatDaimoLink({
      type: "requestv2",
      id: idString,
      recipient,
      dollars: `${amount}`,
    });
    console.log(`[DAIMOBOT REQUEST] url ${daimoShareUrl}`);
    return daimoShareUrl;
  }

  private async publishCastReply(text: string, opts: SendCastOptions = {}) {
    await this.neynarClient
      .publishCast(DAIMOBOT_SIGNER_UUID, text, {
        ...opts,
        replyTo: this.castId,
      })
      .then((data) => console.log(data))
      .catch((err) => console.error(err));
  }

  private async getFcUsernameByFid(fid: number) {
    const profile = await this.neynarClient.fetchBulkUsers([fid]);
    const len = profile.users.length;
    assert(len === 1, `Expected exactly 1 user to be returned, got ${len}`);
    return profile.users[0].username;
  }
}
