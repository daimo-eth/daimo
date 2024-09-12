import {
  AddrLabel,
  DaimoNoteState,
  DaimoNoteStatus,
  DaimoRequestState,
  DaimoRequestV2Status,
  amountToDollars,
  assert,
  assertNotNull,
  debugJson,
  getAccountName,
  getDisplayFromTo,
  getSlotLabel,
  parseRequestMetadata,
  retryBackoff,
  getForeignCoinDisplayAmount,
} from "@daimo/common";
import { Expo, ExpoPushMessage } from "expo-server-sdk";
import { Address, getAddress } from "viem";

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

const pushEnabled = getEnvApi().DAIMO_PUSH_ENABLED;

/** Represents a single push notification sent to a single user. */
export interface PushNotification {
  /** Daimo account address */
  address: Address;
  /** Unique key (per-address), prevents duplicate push. */
  key: string;
  /** Push title, body, and metadata. */
  expoPush: ExpoPushMessage;
}

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
    console.log(`[PUSH] initialized, push notifs enabled: ${pushEnabled}`);
  }

  private handleNoteOps = async (logs: DaimoNoteStatus[]) => {
    console.log(`[PUSH] got ${logs.length} note ops`);
    const notifs = this.getPushNotifsFromNoteOps(logs);
    this.maybeSendNotifications(notifs);
  };

  private handleTransfers = async (logs: Transfer[]) => {
    console.log(`[PUSH] got ${logs.length} transfers`);
    const notifs = await this.getPushNotifsFromTransfers(logs);
    this.maybeSendNotifications(notifs);
  };

  private handleForeignCoinTransfers = async (logs: ForeignTokenTransfer[]) => {
    console.log(`[PUSH] got ${logs.length} foreign coin transfers`);
    const notifs: PushNotification[] = [];
    for (const log of logs) {
      const logNotifs = await this.getPushNotifsFromForeignCoinTransfer(log);
      notifs.push(...logNotifs);
    }

    this.maybeSendNotifications(notifs);
  };

  private handleKeyRotations = async (logs: KeyChange[]) => {
    console.log(`[PUSH] got ${logs.length} key rotations`);
    const notifs = this.getPushNotifsFromKeyRotations(logs);
    this.maybeSendNotifications(notifs);
  };

  private handleRequests = async (logs: DaimoRequestV2Status[]) => {
    console.log(`[PUSH] got ${logs.length} requests`);
    const notifs = this.getPushNotifsFromRequests(logs);
    this.maybeSendNotifications(notifs);
  };

  private async maybeSendNotifications(notifs: PushNotification[]) {
    // Don't double notify
    const promises = notifs.map((m) => this.db.tryInsertPushNotification(m));
    const insertResults = await Promise.all(promises);

    // Log the notification. In local development, stop there
    const messages = [] as ExpoPushMessage[];
    for (let i = 0; i < notifs.length; i++) {
      const msg = notifs[i].expoPush;
      const alreadySent = insertResults[i] === 0;
      const msgStr = `${msg.to}: ${msg.title}: ${msg.body}`;
      if (!pushEnabled) {
        console.log(`[PUSH] SKIPPING, push disabled: ${msgStr}`);
      } else if (alreadySent) {
        console.log(`[PUSH] SKIPPING, already sent: ${msgStr}`);
      } else {
        console.log(`[PUSH] notifying: ${msgStr}`);
        messages.push(msg);
      }
    }

    // Send unsent push notifications, if any
    if (messages.length === 0) return;
    console.log(`[PUSH] sending ${messages.length} notifications`);
    this._sendExpoNotifications(messages);
  }

  private async _sendExpoNotifications(messages: ExpoPushMessage[]) {
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
          address: addr,
          key: "welcome",
          expoPush: {
            to: pushToken,
            title: "Welcome to Daimo",
            body: "You'll get a notification when you receive a payment.",
          },
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
  ): PushNotification[] {
    const key = `req-created-${log.link.id}`;

    // Parse log
    const recipientAddr = getAddress(log.recipient.addr);
    const { dollars } = log.link;
    const { fulfiller } = parseRequestMetadata(log.metadata);
    const fromName =
      fulfiller && this.nameReg.resolveDaimoNameForAddr(fulfiller);

    // Get push notification for the requester (= payment recipient)
    const { tokenSymbol } = chainConfig;
    const fromStr = fromName ? ` from ${fromName}` : "";
    return this.getPushNotifs(
      recipientAddr,
      key,
      "Request created",
      `Requesting $${dollars} ${tokenSymbol}${fromStr}`
    );
  }

  async getPushNotifsFromTransfers(logs: Transfer[]) {
    const notifs: PushNotification[] = [];
    for (const log of logs) {
      assert(log.transactionHash != null, "transfer missing txHash");

      const [a, b] = await Promise.all([
        this.getPushNotifsFromTransfer(log, log.from),
        this.getPushNotifsFromTransfer(log, log.to),
      ]);
      notifs.push(...a, ...b);
    }
    return notifs;
  }

  async getPushNotifsFromTransfer(
    log: Transfer,
    addr: Address
  ): Promise<PushNotification[]> {
    const transferClog = this.coinIndexer.createTransferClog(log, addr);

    const { txHash, logIndex } = transferClog;
    const [from, to] = getDisplayFromTo(transferClog);
    let other;
    let amount;
    if (transferClog.to === addr) {
      amount = transferClog.amount;
      other = from;
    } else if (transferClog.from === addr) {
      amount = -transferClog.amount;
      other = to;
    } else {
      throw new Error(`wrong from/to ${debugJson({ addr, transferClog })}`);
    }

    // Only handle simple transfers and swaps
    if (transferClog.type !== "transfer") {
      return [];
    }

    const pushTokens = this.pushTokens.get(addr);
    if (!pushTokens || pushTokens.length === 0) return [];

    const { tokenSymbol } = chainConfig;
    const dollars = amountToDollars(Math.abs(amount));

    // Get the other side
    const otherAcc = await this.nameReg.getEAccount(other);
    if (otherAcc.label === AddrLabel.Paymaster) return []; // ignore paymaster transfers
    const otherAccStr = getAccountName(otherAcc);

    const title = (() => {
      // TODO: special handling for in/outbound swap = pre/postSwapTransfer ?
      // Simple transfer: same coin.
      return amount < 0
        ? `Sent $${dollars} to ${otherAccStr}`
        : `Received $${dollars} from ${otherAccStr}`;
    })();

    const body = (() => {
      // Transfer with memo
      if (transferClog.memo) return transferClog.memo;

      // Transfer as a request
      if (transferClog.type === "transfer") {
        if (transferClog.requestStatus?.memo)
          return transferClog.requestStatus.memo;

        // Transfer fulilling request
        if (transferClog.requestStatus) {
          assert(
            transferClog.requestStatus.status === DaimoRequestState.Fulfilled
          );
          if (amount > 0) {
            return `Your ${dollars} ${tokenSymbol} request was fulfilled`;
          } else {
            return `You fulfilled ${dollars} ${tokenSymbol} request`;
          }
        }
      }

      // Inbound swap, outbound swap, or home coin + home chain standard transfer.
      if (transferClog.preSwapTransfer) {
        const { amount, coin } = transferClog.preSwapTransfer;
        const readableAmount = getForeignCoinDisplayAmount(amount, coin);
        return `You accepted ${readableAmount} ${coin.symbol} as $${dollars} ${tokenSymbol}`;
      } else if (transferClog.postSwapTransfer) {
        const { amount, coin } = transferClog.postSwapTransfer;
        const readableAmount = getForeignCoinDisplayAmount(amount, coin);
        return `You sent ${readableAmount} ${coin.symbol} to ${otherAccStr}`;
      } else if (amount < 0) {
        return `You sent ${dollars} ${tokenSymbol} to ${otherAccStr}`;
      } else {
        return `You received ${dollars} ${tokenSymbol} from ${otherAccStr}`;
      }
    })();

    return [
      {
        address: addr,
        key: `transfer-${txHash}-${logIndex}`,
        expoPush: {
          to: pushTokens,
          badge: 1,
          title,
          body,
          data: { txHash, logIndex },
        },
      },
    ];
  }

  async getPushNotifsFromForeignCoinTransfer(
    log: ForeignTokenTransfer
  ): Promise<PushNotification[]> {
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
        address: log.to,
        key: `foreign-transfer-${log.transactionHash}-${log.logIndex}`,
        expoPush: {
          to: pushTokens,
          badge: 1,
          title,
          body,
          data: { txHash: log.transactionHash },
        },
      },
    ];
  }

  private getPushNotifsFromRequests(
    logs: DaimoRequestV2Status[]
  ): PushNotification[] {
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
        const key = `created-req-${log.link.id}`;
        console.log(`[PUSH] request created, notifying fulfiller: ${key}`);
        messages.push(
          ...this.getPushNotifs(
            fulfiller,
            key,
            "Request received",
            `${log.recipient.name} requested $${dollars} ${tokenSymbol}`
          )
        );
      }
    }

    return messages;
  }

  getPushNotifsFromNoteOps(logs: DaimoNoteStatus[]) {
    const symbol = chainConfig.tokenSymbol;

    const messages: PushNotification[] = [];
    for (const log of logs) {
      const { memo } = log;
      if (log.status === DaimoNoteState.Confirmed) {
        // To Alice: "You sent $3.50 to a payment link"
        const { sender, dollars, ephemeralOwner } = log;
        const key = `confirmed-note-${assertNotNull(ephemeralOwner)}`;
        const title = addMemo(`Sent $${dollars}`, memo);
        const body = `You sent ${dollars} ${symbol} to a payment link`;
        messages.push(...this.getPushNotifs(sender.addr, key, title, body));
      } else if (log.status === DaimoNoteState.Claimed) {
        // To Bob: "You received $1.00 from alice"
        // To Alice: "Bob accepted your $1.00 payment link"
        const claimer = assertNotNull(log.claimer);
        const { sender, dollars } = log;
        assert(sender.addr !== claimer.addr);
        const key = `claimed-note-${assertNotNull(log.ephemeralOwner)}`;
        messages.push(
          ...this.getPushNotifs(
            sender.addr,
            key,
            addMemo(`$${dollars} sent`, memo),
            `${getAccountName(
              claimer
            )} accepted your ${dollars} ${symbol} payment link`
          ),
          ...this.getPushNotifs(
            claimer.addr,
            key,
            addMemo(`Received $${dollars}`, memo),
            `You received ${dollars} ${symbol} from ${getAccountName(sender)}`
          )
        );
      } else {
        // To Alice: "You cancelled your $1.00 payment link"
        const { sender, dollars, ephemeralOwner } = log;
        assert(log.status === DaimoNoteState.Cancelled);
        assert(log.claimer?.addr === sender.addr);
        const key = `cancelled-note-${assertNotNull(ephemeralOwner)}`;
        messages.push(
          ...this.getPushNotifs(
            sender.addr,
            key,
            addMemo(`Reclaimed $${dollars}`, memo),
            `You cancelled your ${dollars} ${symbol} payment link`
          )
        );
      }
    }

    return messages;
  }

  getPushNotifsFromKeyRotations(logs: KeyChange[]) {
    const messages: PushNotification[] = [];
    for (const log of logs) {
      const addr = getAddress(log.address);
      const keyLabel = getSlotLabel(log.keySlot);
      const key = `${log.transactionHash}-${log.logIndex}`;

      // Skip notifications for account creation
      if (this.keyReg.isDeploymentKeyRotationLog(log)) continue;

      if (log.change === "added") {
        const title = `${keyLabel} added`;
        const body = `You added ${keyLabel} to your account`;
        messages.push(...this.getPushNotifs(addr, key, title, body));
      } else {
        assert(log.change === "removed");
        const title = `${keyLabel} removed`;
        const body = `You removed ${keyLabel} from your account`;
        messages.push(...this.getPushNotifs(addr, key, title, body));
      }
    }

    return messages;
  }

  private getPushNotifs(
    address: Address,
    key: string,
    title: string,
    body: string
  ): PushNotification[] {
    const pushTokens = this.pushTokens.get(address);
    if (pushTokens == null) return [];

    return [
      {
        address,
        key,
        expoPush: { to: pushTokens, badge: 1, title, body },
      },
    ];
  }
}

function addMemo(title: string, memo?: string): string {
  if (memo == null) return title;
  return `${title} · ${memo}`;
}
