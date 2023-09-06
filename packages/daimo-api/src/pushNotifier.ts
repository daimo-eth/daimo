import { assert, assertNotNull } from "@daimo/common";
import { tokenMetadata } from "@daimo/contract";
import { Expo, ExpoPushMessage } from "expo-server-sdk";
import { Address, Hex, formatUnits, getAddress } from "viem";

import { AddrLabel, getAccountName } from ".";
import { CoinIndexer, TransferLog } from "./contract/coinIndexer";
import { KeyRegistry } from "./contract/keyRegistry";
import { NameRegistry } from "./contract/nameRegistry";
import { NoteIndexer, NoteOpLog } from "./contract/noteIndexer";
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
    private noteIndexer: NoteIndexer,
    private keyReg: KeyRegistry, // TODO: notify devices on key add/remove
    private db: DB
  ) {}

  async init() {
    this.coinIndexer.addListener(this.handleTransfers);

    this.noteIndexer.addListener(this.handleNoteOps);

    // Load Expo push notification tokens
    const rows = await this.db.loadPushTokens();
    console.log(`[PUSH] loaded ${rows.length} push tokens from DB`);
    for (const row of rows) {
      this.cachePushToken(getAddress(row.address), row.pushtoken);
    }
  }

  private handleNoteOps = async (logs: NoteOpLog[]) => {
    console.log(`[PUSH] got ${logs.length} note ops`);
    const messages = this.getPushMessagesFromNoteOps(logs);
    this.maybeSendNotifications(messages);
  };

  private handleTransfers = async (logs: TransferLog[]) => {
    console.log(`[PUSH] got ${logs.length} transfers`);
    const messages = await this.getPushMessagesFromTransfers(logs);
    this.expo.sendPushNotificationsAsync(messages);
  };

  async maybeSendNotifications(messages: ExpoPushMessage[]) {
    // Log the notification. In local development, stop there.
    const verb = pushEnabled ? "notifying" : "NOT notifying";
    for (const msg of messages) {
      console.log(`[PUSH] ${verb} ${msg.to}: ${msg.title}: ${msg.body}`);
    }

    if (pushEnabled) {
      console.log(`[PUSH] sending ${messages.length} notifications`);
      this.expo.sendPushNotificationsAsync(messages);
    }
  }

  async getPushMessagesFromTransfers(logs: TransferLog[]) {
    const messages: ExpoPushMessage[] = [];
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

      const [a, b] = await Promise.all([
        this.getPushMessagesFromTransfer(log.transactionHash, from, to, -value),
        this.getPushMessagesFromTransfer(log.transactionHash, to, from, value),
      ]);
      messages.push(...a, ...b);
    }
    return messages;
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

  private async getPushMessagesFromTransfer(
    txHash: Hex,
    addr: Address,
    other: Address,
    value: bigint
  ): Promise<ExpoPushMessage[]> {
    const pushTokens = this.pushTokens.get(addr);
    if (!pushTokens || pushTokens.length === 0) return [];

    const { decimals, symbol } = tokenMetadata;
    const rawAmount = formatUnits(value, decimals);
    const dollars = Math.abs(Number(rawAmount)).toFixed(2);

    // Get the other side
    const otherAcc = await this.nameReg.getEAccount(other);
    if (otherAcc.label === AddrLabel.PaymentLink) {
      // Handled separately, see maybeNotifyPaymentLink
      return [];
    }
    const otherStr = getAccountName(otherAcc);

    const title = value < 0 ? `Sent $${dollars}` : `Received $${dollars}`;
    const body =
      value < 0
        ? `You sent ${dollars} ${symbol} to ${otherStr}`
        : `You received ${dollars} ${symbol} from ${otherStr}`;

    return [
      {
        to: pushTokens,
        badge: 1,
        title,
        body,
        data: { txHash },
      },
    ];
  }

  getPushMessagesFromNoteOps(logs: NoteOpLog[]) {
    const { symbol } = tokenMetadata;

    const messages: ExpoPushMessage[] = [];
    for (const log of logs) {
      if (log.type === "create") {
        // To Alice: "You sent $3.50 to a payment link"
        const { sender, dollars } = log.noteStatus;
        const title = `Sent $${dollars}`;
        const body = `You sent ${dollars} ${symbol} to a payment link`;
        messages.push(...this.getPushMessages(sender.addr, title, body));
      } else if (log.noteStatus.status === "claimed") {
        // To Bob: "You received $1.00 from alice"
        // To Alice: "Bob claimed your $1.00 payment link"
        const claimer = assertNotNull(log.noteStatus.claimer);
        const { sender, dollars } = log.noteStatus;
        assert(sender.addr !== claimer.addr);
        messages.push(
          ...this.getPushMessages(
            sender.addr,
            `$${dollars} claimed`,
            `${getAccountName(
              claimer
            )} claimed your ${dollars} ${symbol} payment link`
          ),
          ...this.getPushMessages(
            claimer.addr,
            `Received $${dollars}`,
            `You received ${dollars} ${symbol} from ${getAccountName(sender)}`
          )
        );
      } else {
        // To Alice: "You cancelled your $1.00 payment link"
        const { sender, dollars } = log.noteStatus;
        assert(log.noteStatus.status === "cancelled");
        assert(log.noteStatus.claimer?.addr === sender.addr);
        messages.push(
          ...this.getPushMessages(
            sender.addr,
            `$${dollars} claimed`,
            `You cancelled your ${dollars} ${symbol} payment link`
          )
        );
      }
    }

    return messages;
  }

  private getPushMessages(
    to: Address,
    title: string,
    body: string
  ): ExpoPushMessage[] {
    const pushTokens = this.pushTokens.get(to);
    if (pushTokens == null) return [];

    return [
      {
        to: pushTokens,
        badge: 1,
        title,
        body,
      },
    ];
  }
}
