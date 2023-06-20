import { erc20ABI, tokenMetadata } from "@daimo/contract";
import { Expo } from "expo-server-sdk";
import {
  Address,
  Hex,
  Log,
  PublicClient,
  formatUnits,
  getAbiItem,
  getContract,
  hexToString,
} from "viem";

import { ReadOnlyContractType } from "./chain";
import { NameRegistry } from "./contract/nameRegistry";
import { DB } from "./db/db";

const transferEvent = getAbiItem({ abi: erc20ABI, name: "Transfer" });
type TransferLog = Log<bigint, number, typeof transferEvent>;

/**
 * Subscribes to coin transfers onchain. Whenever a transfer affects a Daimo
 * account, sends a push notification to each of the user's devices.
 */
export class PushNotifier {
  coinContract: ReadOnlyContractType<typeof erc20ABI>;
  pushTokens = new Map<Address, string[]>();
  expo = new Expo();

  constructor(
    private publicClient: PublicClient,
    private nameReg: NameRegistry,
    private db: DB
  ) {
    this.coinContract = getContract({
      abi: erc20ABI,
      address: tokenMetadata.address,
      publicClient,
    });
  }

  async init() {
    // Subscribe to transfers
    this.coinContract.watchEvent.Transfer(
      {},
      { batch: true, onLogs: this.handleTransfers }
    );
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
    if (!pushTokens) return;

    const { symbol } = tokenMetadata;
    const dollars = formatDollars(value);
    const verb = value < 0 ? "sent" : "received";
    console.log(`[PUSH] notifying ${addr} ${verb} ${dollars} ${symbol}`);

    // Get the other side
    const otherNameHex = await this.nameReg.resolveName(other);
    const otherName = otherNameHex
      ? hexToString(otherNameHex)
      : other.substring(0, 8) + "...";

    const title = value < 0 ? `Sent $${dollars}` : `Received $${dollars}`;
    const body =
      value < 0
        ? `You sent ${dollars} ${symbol} to ${otherName}`
        : `You received ${dollars} ${symbol} from ${otherName}`;

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
      throw new Error(`Invalid push token ${pushToken} for ${addr}`);
    }

    const tokens = this.pushTokens.get(addr) || [];
    if (tokens.includes(pushToken)) {
      console.log(`[PUSH] already registered ${pushToken} for ${addr}`);
      return;
    }

    console.log(`[PUSH] registering ${pushToken} for ${addr}`);
    this.pushTokens.set(addr, [...tokens, pushToken]);

    await Promise.all([
      this.db.savePushToken({ address: addr, pushToken }),
      this.expo.sendPushNotificationsAsync([
        {
          to: pushToken,
          title: "Welcome to Daimo",
          body: "You'll get a notification when you receive a payment.",
        },
      ]),
    ]);
  }
}
