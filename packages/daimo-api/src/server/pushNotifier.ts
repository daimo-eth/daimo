import {
  AddrLabel,
  DaimoNoteState,
  DaimoNoteStatus,
  DaimoRequestState,
  DaimoRequestV2Status,
  TransferClog,
  amountToDollars,
  assert,
  assertNotNull,
  getAccountName,
  getDisplayFromTo,
  getForeignCoinDisplayAmount,
  getSlotLabel,
  parseRequestMetadata,
} from "@daimo/common";
import { Expo, ExpoPushMessage } from "expo-server-sdk";
import { Address, Hex, getAddress } from "viem";

import {
  ForeignCoinIndexer,
  ForeignTokenTransfer,
} from "../contract/foreignCoinIndexer";
import { HomeCoinIndexer, Transfer } from "../contract/homeCoinIndexer";
import { KeyChange, KeyRegistry } from "../contract/keyRegistry";
import { NameRegistry } from "../contract/nameRegistry";
import { NoteIndexer } from "../contract/noteIndexer";
import { RequestIndexer } from "../contract/requestIndexer";
import { DB } from "../db/db";
import { chainConfig, getEnvApi } from "../env";
import { retryBackoff } from "../utils/retryBackoff";

const pushEnabled = getEnvApi().DAIMO_PUSH_ENABLED;

/**
 * Subscribes to coin transfers onchain. Whenever a transfer affects a Daimo
 * account, sends a push notification to each of the user's devices.
 */
export class PushNotifier {
  pushTokens = new Map<Address, string[]>();
  expo = new Expo();

  isInitialized = false;

  constructor(
    private coinIndexer: HomeCoinIndexer,
    private foreignCoinIndexer: ForeignCoinIndexer,
    private nameReg: NameRegistry,
    private noteIndexer: NoteIndexer,
    private requestIndexer: RequestIndexer,
    private keyReg: KeyRegistry,
    private db: DB
  ) {}

  async init() {
    this.coinIndexer.addListener(this.handleTransfers);
    this.foreignCoinIndexer.addListener(this.handleForeignCoinTransfers);
    this.noteIndexer.addListener(this.handleNoteOps);
    this.keyReg.addListener(this.handleKeyRotations);
    this.requestIndexer.addListener(this.handleRequests);

    // Load Expo push notification tokens
    const rows = await retryBackoff(`loadPushTokens`, () =>
      this.db.loadPushTokens()
    );
    console.log(`[PUSH] loaded ${rows.length} push tokens from DB`);
    for (const row of rows) {
      this.cachePushToken(getAddress(row.address), row.pushtoken);
    }

    this.isInitialized = true;
    console.log(
      `[PUSH] initialized, future indexing will be pushed notifications`
    );
  }

  private handleNoteOps = async (logs: DaimoNoteStatus[]) => {
    console.log(`[PUSH] got ${logs.length} note ops`);
    const messages = this.getPushMessagesFromNoteOps(logs);
    this.maybeSendNotifications(messages);
  };

  private handleTransfers = async (logs: Transfer[]) => {
    console.log(`[PUSH] got ${logs.length} transfers`);
    const messages = await this.getPushMessagesFromTransfers(logs);
    this.maybeSendNotifications(messages);
  };

  private handleForeignCoinTransfers = async (logs: ForeignTokenTransfer[]) => {
    console.log(`[PUSH] got ${logs.length} foreign coin transfers`);
    const messages: ExpoPushMessage[] = [];

    for (const log of logs) {
      messages.push(
        ...(await this.getPushMessagesFromForeignCoinTransfer(log))
      );
    }

    this.maybeSendNotifications(messages);
  };

  private handleKeyRotations = async (logs: KeyChange[]) => {
    console.log(`[PUSH] got ${logs.length} key rotations`);
    const messages = this.getPushMessagesFromKeyRotations(logs);
    this.maybeSendNotifications(messages);
  };

  private handleRequests = async (logs: DaimoRequestV2Status[]) => {
    console.log(`[PUSH] got ${logs.length} requests`);
    const messages = this.getPushMessagesFromRequests(logs);
    this.maybeSendNotifications(messages);
  };

  /** NOT MEANT TO BE CALLED DIRECTLY: Always use maybeSendNotifications */
  private async sendExpoNotifications(messages: ExpoPushMessage[]) {
    try {
      const chunks = this.expo.chunkPushNotifications(messages);

      for (const chunk of chunks) {
        const receipts = await this.expo.sendPushNotificationsAsync(chunk);
        console.log(`[PUSH] sent ${receipts.length} receipts`);
      }
    } catch (e) {
      console.error(`[PUSH] error sending notifications: ${e}`);
    }
  }

  async maybeSendNotifications(messages: ExpoPushMessage[]) {
    if (messages.length === 0) return;

    // Log the notification. In local development, stop there.
    const verb = pushEnabled ? "notifying" : "NOT notifying";
    for (const msg of messages) {
      console.log(`[PUSH] ${verb} ${msg.to}: ${msg.title}: ${msg.body}`);
    }

    if (pushEnabled) {
      console.log(`[PUSH] sending ${messages.length} notifications`);
      if (messages.length !== 0) this.sendExpoNotifications(messages);
    }
  }

  async getPushMessagesFromTransfers(logs: Transfer[]) {
    const messages: ExpoPushMessage[] = [];
    for (const log of logs) {
      const logId = `${log.transactionHash}:${log.logIndex}`;
      if (log.transactionHash == null) {
        console.warn(`[PUSH] skipping unconfirmed tx: ${logId}`);
        continue;
      }

      const opEvent = this.coinIndexer.attachTransferOpProperties(log);
      const [from, to] = getDisplayFromTo(opEvent);

      const [a, b] = await Promise.all([
        this.getPushMessagesFromTransfer(
          log.transactionHash,
          from,
          to,
          -opEvent.amount,
          opEvent
        ),
        this.getPushMessagesFromTransfer(
          log.transactionHash,
          to,
          from,
          opEvent.amount,
          opEvent
        ),
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

    console.log(`[PUSH] caching and registering ${pushToken} for ${addr}`);
    this.cachePushToken(addr, pushToken);

    await Promise.all([
      retryBackoff(`savePushToken`, () =>
        this.db.savePushToken({ address: addr, pushtoken: pushToken })
      ),
      this.maybeSendNotifications([
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

    this.pushTokens.set(addr, [...tokens, pushToken]);
  }

  sendPushNotificationForRequestCreated(log: DaimoRequestV2Status) {
    const notifs = this.getPushNotificationForRequestCreated(log);
    this.maybeSendNotifications(notifs);
  }

  getPushNotificationForRequestCreated(
    log: DaimoRequestV2Status
  ): ExpoPushMessage[] {
    // Parse log
    const recipientAddr = getAddress(log.recipient.addr);
    const { dollars } = log.link;
    const { fulfiller } = parseRequestMetadata(log.metadata);
    const fromName =
      fulfiller && this.nameReg.resolveDaimoNameForAddr(fulfiller);

    // Get push notification for the requester (= payment recipient)
    const { tokenSymbol } = chainConfig;
    const fromStr = fromName ? ` from ${fromName}` : "";
    return this.getPushMessages(
      recipientAddr,
      "Request created",
      `Requesting $${dollars} ${tokenSymbol}${fromStr}`
    );
  }

  async getPushMessagesFromTransfer(
    txHash: Hex,
    addr: Address,
    other: Address,
    amount: number,
    opEvent: TransferClog
  ): Promise<ExpoPushMessage[]> {
    if (opEvent.type !== "transfer") return []; // Only transfer opEvents handled here

    const pushTokens = this.pushTokens.get(addr);
    if (!pushTokens || pushTokens.length === 0) return [];

    const { tokenSymbol } = chainConfig;
    const dollars = amountToDollars(Math.abs(amount));

    // Get the other side
    const otherAcc = await this.nameReg.getEAccount(other);

    if (otherAcc.label === AddrLabel.Paymaster) {
      // ignore paymaster transfers
      return [];
    }

    const otherStr = getAccountName(otherAcc);

    const title = (() => {
      if (opEvent.preSwapTransfer) {
        assert(amount > 0); // foreignCoin can only be involved in receiving ends of swaps
        return `Accepted $${dollars} from ${otherStr}`;
      } else if (amount < 0) return `Sent $${dollars} to ${otherStr}`;
      else return `Received $${dollars} from ${otherStr}`;
    })();

    const body = (() => {
      // Transfer with memo
      if (opEvent.memo) return opEvent.memo;
      if (opEvent.requestStatus?.memo) return opEvent.requestStatus.memo;

      // Transfer fulilling request
      if (opEvent.requestStatus) {
        assert(opEvent.requestStatus.status === DaimoRequestState.Fulfilled);
        if (amount > 0) {
          return `Your ${dollars} ${tokenSymbol} request was fulfilled`;
        } else {
          return `You fulfilled ${dollars} ${tokenSymbol} request`;
        }
      }

      // Swap
      if (opEvent.preSwapTransfer) {
        assert(amount > 0); // foreignCoin can only be involved in receiving ends of swaps
        const readableAmount = getForeignCoinDisplayAmount(
          opEvent.preSwapTransfer.amount,
          opEvent.preSwapTransfer.coin
        );
        return `You accepted ${readableAmount} ${opEvent.preSwapTransfer.coin.symbol} as $${dollars} ${tokenSymbol}`;
      }

      // Vanilla transfer
      if (amount < 0) {
        return `You sent ${dollars} ${tokenSymbol} to ${otherStr}`;
      } else {
        return `You received ${dollars} ${tokenSymbol} from ${otherStr}`;
      }
    })();

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

  async getPushMessagesFromForeignCoinTransfer(
    log: ForeignTokenTransfer
  ): Promise<ExpoPushMessage[]> {
    const pushTokens = this.pushTokens.get(getAddress(log.to));
    if (!pushTokens || pushTokens.length === 0) return [];

    const readableAmount = getForeignCoinDisplayAmount(
      log.value.toString() as `${bigint}`,
      log.foreignToken
    );
    const swap = await this.foreignCoinIndexer.getProposedSwapForLog(log);
    if (swap == null) return [];

    const dollars = amountToDollars(swap.toAmount);

    // Get the other side
    const otherAcc = await this.nameReg.getEAccount(log.from);
    const otherStr = getAccountName(otherAcc);

    const title = `Received ${readableAmount} ${log.foreignToken.symbol} from ${otherStr}`;
    const body = `Accept ${readableAmount} ${log.foreignToken.symbol} as $${dollars} USDC`;

    return [
      {
        to: pushTokens,
        badge: 1,
        title,
        body,
        data: { txHash: log.transactionHash },
      },
    ];
  }

  private getPushMessagesFromRequests(
    logs: DaimoRequestV2Status[]
  ): ExpoPushMessage[] {
    const messages = [];
    const { tokenSymbol } = chainConfig;

    for (const log of logs) {
      // Only proceed if log is relevant.
      if (log.status !== DaimoRequestState.Created) continue;

      // On creation, parse fulfiller name from metadata.
      if (log.recipient.name && log.status === DaimoRequestState.Created) {
        const { fulfiller } = parseRequestMetadata(log.metadata);
        const { dollars } = log.link;
        if (fulfiller == null) continue;

        // Don't notify recipient = the account sending the request here
        // This push notif is sent earlier, during createRequestSponsored()
        // Notify fulfiller = the account they're requesting from
        console.log(`[PUSH] request created, notifying fulfiller`);
        messages.push(
          ...this.getPushMessages(
            fulfiller,
            "Request received",
            `${log.recipient.name} requested $${dollars} ${tokenSymbol}`
          )
        );
      }
    }

    return messages;
  }

  getPushMessagesFromNoteOps(logs: DaimoNoteStatus[]) {
    const symbol = chainConfig.tokenSymbol;

    const messages: ExpoPushMessage[] = [];
    for (const log of logs) {
      const { memo } = log;

      if (log.status === DaimoNoteState.Confirmed) {
        // To Alice: "You sent $3.50 to a payment link"
        const { sender, dollars } = log;
        const title = addMemo(`Sent $${dollars}`, memo);
        const body = `You sent ${dollars} ${symbol} to a payment link`;
        messages.push(...this.getPushMessages(sender.addr, title, body));
      } else if (log.status === DaimoNoteState.Claimed) {
        // To Bob: "You received $1.00 from alice"
        // To Alice: "Bob accepted your $1.00 payment link"
        const claimer = assertNotNull(log.claimer);
        const { sender, dollars } = log;
        assert(sender.addr !== claimer.addr);
        messages.push(
          ...this.getPushMessages(
            sender.addr,
            addMemo(`$${dollars} sent`, memo),
            `${getAccountName(
              claimer
            )} accepted your ${dollars} ${symbol} payment link`
          ),
          ...this.getPushMessages(
            claimer.addr,
            addMemo(`Received $${dollars}`, memo),
            `You received ${dollars} ${symbol} from ${getAccountName(sender)}`
          )
        );
      } else {
        // To Alice: "You cancelled your $1.00 payment link"
        const { sender, dollars } = log;
        assert(log.status === DaimoNoteState.Cancelled);
        assert(log.claimer?.addr === sender.addr);
        messages.push(
          ...this.getPushMessages(
            sender.addr,
            addMemo(`Reclaimed $${dollars}`, memo),
            `You cancelled your ${dollars} ${symbol} payment link`
          )
        );
      }
    }

    return messages;
  }

  getPushMessagesFromKeyRotations(logs: KeyChange[]) {
    const messages: ExpoPushMessage[] = [];
    for (const log of logs) {
      const addr = getAddress(log.address);
      const keyLabel = getSlotLabel(log.keySlot);

      // Skip notifications for account creation
      if (this.keyReg.isDeploymentKeyRotationLog(log)) continue;

      if (log.change === "added") {
        const title = `${keyLabel} added`;
        const body = `You added ${keyLabel} to your account`;
        messages.push(...this.getPushMessages(addr, title, body));
      } else {
        assert(log.change === "removed");
        const title = `${keyLabel} removed`;
        const body = `You removed ${keyLabel} from your account`;
        messages.push(...this.getPushMessages(addr, title, body));
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

function addMemo(title: string, memo?: string): string {
  if (memo == null) return title;
  return `${title} · ${memo}`;
}
