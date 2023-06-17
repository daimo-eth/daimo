import { Expo } from "expo-server-sdk";
import { Address, PublicClient } from "viem";

interface PushAccount {
  addr: Address;
  pushTokens: string[];
}

export class PushNotifier {
  // TODO: db

  private accounts: PushAccount[] = [];

  async init(publicClient: PublicClient) {
    // TODO: subscribe to transfers
  }

  /** Validates the push token, then subscribes to events affecting addr.  */
  register(addr: Address, pushToken: string) {
    if (!Expo.isExpoPushToken(pushToken)) {
      throw new Error(`Invalid push token ${pushToken} for ${addr}`);
    }

    const account = this.find(addr);
    if (account == null) {
      console.log(`[PUSH] registering ${addr} with push token ${pushToken}`);
      this.accounts.push({ addr, pushTokens: [pushToken] });
    } else if (account.pushTokens.includes(pushToken)) {
      console.log(`[PUSH] token ${pushToken} already registered for ${addr}`);
      return;
    } else {
      console.log(`[PUSH] adding push token ${pushToken} to ${addr}`);
      account.pushTokens.push(pushToken);
    }

    //TODO
    const expo = new Expo();
    expo.sendPushNotificationsAsync([
      {
        to: pushToken,
        title: "Welcome to Daimo!",
        body: "You'll get a notification when you receive a payment.",
      },
    ]);
  }

  find(addr: Address): PushAccount | undefined {
    return this.accounts.find((a) => a.addr === addr);
  }
}
