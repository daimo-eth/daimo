import { tokenMetadata } from "@daimo/contract";
import { Expo } from "expo-server-sdk";
import { Address, Hex, formatUnits, getAddress } from "viem";

import { getAccountName } from ".";
import { CoinIndexer, TransferLog } from "./contract/coinIndexer";
import { KeyRegistry } from "./contract/keyRegistry";
import { NameRegistry } from "./contract/nameRegistry";
import { DB } from "./db/db";

const pushEnabled = process.env.DAIMO_PUSH_ENABLED === "true";

/**
 * Subscribes to coin transfers onchain. Whenever a transfer affects a Daimo
 * account, sends a push notification to each of the user's devices.
 */
export class PushNotifier {
  pushTokens = new Map<Address, string[]>();
  expo = new Expo();

  constructor(
    private coinIndexer: CoinIndexer,
    private nameReg: NameRegistry,
    private keyReg: KeyRegistry, // TODO: notify devices on key add/remove
    private db: DB
  ) {}

  async init() {
    this.coinIndexer.addListener(this.handleTransfers);
    const rows = await this.db.loadPushTokens();
    console.log(`[PUSH] loaded ${rows.length} push tokens from DB`);
    for (const row of rows) {
      this.cachePushToken(getAddress(row.address), row.pushtoken);
    }
  }

  private handleTransfers = async (logs: TransferLog[]) => {
    console.log(`[PUSH] got ${logs.length} transfers`);
    for (const log of logs) {
      const { from, to, value } = log.args;
      if (!from || !to || !value) {
        console.warn(`[PUSH] invalid transfer log: ${JSON.stringify(log)}`);
        continue;
      }
      if (log.transactionHash == null) {
        console.warn(`[PUSH] skipping unconfirmed tx: ${JSON.stringify(log)}`);
        continue;
      }

      this.maybeNotify(log.transactionHash, from, to, -value);
      this.maybeNotify(log.transactionHash, to, from, value);
    }
  };

  private async maybeNotify(
    txHash: Hex,
    addr: Address,
    other: Address,
    value: bigint
  ) {
    const pushTokens = this.pushTokens.get(addr);
    if (!pushTokens || pushTokens.length === 0) return;

    const { decimals, symbol } = tokenMetadata;
    const rawAmount = formatUnits(value, decimals);
    const dollars = Math.abs(Number(rawAmount)).toFixed(2);

    // Get the other side
    const otherAcc = await this.nameReg.getEAccount(other);
    const otherStr = getAccountName(otherAcc);

    const title = value < 0 ? `Sent $${dollars}` : `Received $${dollars}`;
    const body =
      value < 0
        ? `You sent ${dollars} ${symbol} to ${otherStr}`
        : `You received ${dollars} ${symbol} from ${otherStr}`;

    // Log the notification. In local development, stop there.
    const not = pushEnabled ? "" : "NOT ";
    console.log(`[PUSH] ${not}notifying ${addr}: ${title}: ${body}`);
    if (!pushEnabled) return;

    this.expo.sendPushNotificationsAsync([
      {
        to: pushTokens,
        badge: 1,
        title,
        body,
        data: { txHash },
      },
    ]);
  }

  /** Validates the push token, then subscribes to events affecting addr.  */
  async register(addr: Address, pushToken: string) {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.warn(`[PUSH] ignoring bad push token ${pushToken} for ${addr}`);
      return;
    }

    this.cachePushToken(addr, pushToken);

    await Promise.all([
      this.db.savePushToken({ address: addr, pushtoken: pushToken }),
      this.expo.sendPushNotificationsAsync([
        {
          to: pushToken,
          title: "Welcome to Daimo",
          body: "You'll get a notification when you receive a payment.",
        },
      ]),
    ]);
  }

  private cachePushToken(addr: Address, pushToken: string) {
    const tokens = this.pushTokens.get(addr) || [];
    if (tokens.includes(pushToken)) {
      console.log(`[PUSH] already registered ${pushToken} for ${addr}`);
      return;
    }

    console.log(`[PUSH] registering ${pushToken} for ${addr}`);
    this.pushTokens.set(addr, [...tokens, pushToken]);
  }
}
