import { MergeMessageHubEvent } from "@farcaster/hub-nodejs";

export class EventTextProcessor {
  private text: string | null;

  constructor(event: MergeMessageHubEvent) {
    this.text = event.mergeMessageBody.message.data?.castAddBody?.text || null;
  }

  process() {
    if (!this.text?.includes("@daimobot")) return;

    const daimobotCommand = this.tryExtractCommand();
    if (!daimobotCommand) {
      console.log("Did not follow either example above.");
      return;
    }

    const { action, amount } = daimobotCommand;
    switch (action) {
      case "request":
        this.handleRequest(amount);
        break;
      case "pay":
        this.handlePay(amount);
        break;
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

  private handleRequest(amount: number) {
    console.log(`Requesting $${amount}`);
    // handle request
  }

  private handlePay(amount: number) {
    console.log(`Paying $${amount}`);
    // handle payment
  }
}
// Farcaster Idiosyncrasy to remember: Timestamps are calcualted from Farcaster epoch, not Unix epoch
// https://github.com/farcasterxyz/hub-monorepo/blob/main/packages/hub-nodejs/docs/Utils.md#time
