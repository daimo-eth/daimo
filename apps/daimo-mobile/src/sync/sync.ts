import { AccountHistoryResult } from "@daimo/api";
import {
  DisplayOpEvent,
  EAccount,
  OpStatus,
  PendingOpEvent,
  amountToDollars,
  assert,
  assertNotNull,
  now,
} from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import * as SplashScreen from "expo-splash-screen";

import {
  getNetworkState,
  updateNetworkState,
  updateNetworkStateOnline,
} from "./networkState";
import { getAccountManager } from "../logic/accountManager";
import { env } from "../logic/env";
import { SEND_DEADLINE_SECS } from "../logic/opSender";
import { Account } from "../model/account";

class SyncManager {
  retryInterval = 1_000;
  manager = getAccountManager();
  currentAccount: Account | null = null;
  // for tracking retry timeout
  retryTimeout: any = undefined;

  _trpcUnsubscribe: (() => void) | null = null;

  start() {
    this.manager.addListener(this._onAccountChange);
  }

  stop() {
    this.manager.removeListener(this._onAccountChange);

    this.unsubscribe();
  }

  subscribe(account: Account) {
    const daimoChain = daimoChainFromId(account.homeChainId);
    const rpcFunc = env(daimoChain).rpcFunc;

    this.currentAccount = account;

    const sub = rpcFunc.onAccountUpdate.subscribe(
      {
        address: account.address,
        sinceBlockNum: 0,
      },
      {
        onStarted: (...args) => {
          updateNetworkStateOnline();
        },

        onData: (data) => {
          this.manager.transform((a) => applySync(a, data, false));
        },
      }
    );

    this._trpcUnsubscribe = sub.unsubscribe;
  }

  unsubscribe() {
    this._trpcUnsubscribe?.();

    this.currentAccount = null;

    updateNetworkState(() => {
      return {
        status: "offline",
        syncAttemptsFailed: 0,
      };
    });

    clearTimeout(this.retryTimeout);
  }

  _onAccountChange = (newAccount: Account | null) => {
    if (!newAccount) {
      this.unsubscribe();

      return;
    }

    // do nothing if we still use the same wallet
    if (this.currentAccount?.address === newAccount.address) {
      return;
    }

    this.unsubscribe();

    this.subscribe(newAccount);
  };
}

export function startSync() {
  console.log("[SYNC] APP LOAD, starting sync");

  // create small delay to let interface render becuase this callback
  // run right after getting data so the interface still got to adapt
  setTimeout(() => {
    SplashScreen.hideAsync();
  }, 300);

  const manager = new SyncManager();

  manager.start();

  return manager;
}

let lastSyncS = 0;
let lastPushNotificationS = 0;

export function syncAfterPushNotification() {
  lastPushNotificationS = now();
}

function hasPendingOps(account: Account) {
  return (
    account.recentTransfers.find((t) => t.status === "pending") != null ||
    account.pendingKeyRotation.length > 0
  );
}

function hasCacheExpiredSwaps(account: Account) {
  return account.proposedSwaps.some((s) => s.cacheUntil < now());
}

type SyncStatus = "success" | "failed" | "skipped" | "skipped";

async function maybeSync(fromScratch?: boolean): Promise<SyncStatus> {
  const manager = getAccountManager();
  const account = manager.getAccount();
  if (account == null) return "skipped";

  // Synced recently? Wait first.
  const nowS = now();
  let intervalS = 10;

  // Sync faster for 1. pending ops or expired swaps, and 2. recently-failed sync
  if (hasPendingOps(account) || hasCacheExpiredSwaps(account)) {
    intervalS = 1;
  }

  const netState = getNetworkState();
  if (netState.status === "online" && netState.syncAttemptsFailed > 0) {
    intervalS = 1;
  }

  if (fromScratch) {
    return await resync(`initial sync from scratch`, true);
  } else if (lastPushNotificationS + 10 > nowS) {
    return await resync(
      `push notification ${nowS - lastPushNotificationS}s ago`
    );
  } else if (lastSyncS + intervalS > nowS) {
    console.log(`[SYNC] skipping sync, attempted sync recently`);
    return "skipped";
  } else {
    return await resync(`interval ${intervalS}s`);
  }
}

/** Gets latest balance & history for this account, in the background. */
export async function resync(
  reason: string,
  fromScratch?: boolean
): Promise<SyncStatus> {
  const manager = getAccountManager();
  const accOld = manager.getAccount();
  assert(!!accOld, `no account, skipping sync: ${reason}`);

  console.log(`[SYNC] RESYNC ${accOld.name}, ${reason}`);
  lastSyncS = now();

  try {
    const res = await fetchSync(accOld, fromScratch);
    assertNotNull(manager.getAccount(), "deleted during sync");
    manager.transform((a) => applySync(a, res, !!fromScratch));
    console.log(`[SYNC] SUCCEEDED ${accOld.name}`);
    // We are automatically marked online when any RPC req succeeds
    return "success";
  } catch (e) {
    console.error(`[SYNC] FAILED ${accOld.name}`, e);
    // Mark offline
    updateNetworkState((state) => {
      const syncAttemptsFailed = state.syncAttemptsFailed + 1;
      return {
        syncAttemptsFailed,
        status: syncAttemptsFailed > 3 ? "offline" : "online",
      };
    });
    return "failed";
  }
}

/** Hydrate a newly created account to fill in properties from server */
export async function hydrateAccount(account: Account): Promise<Account> {
  const res = await fetchSync(account, true);
  return applySync(account, res, false);
}

/** Loads all account history since the last finalized block as of the previous sync.
 * This means we're guaranteed to see all events even if there were reorgs. */
async function fetchSync(
  account: Account,
  fromScratch?: boolean
): Promise<AccountHistoryResult> {
  const sinceBlockNum = fromScratch ? 0 : account.lastFinalizedBlock;

  const daimoChain = daimoChainFromId(account.homeChainId);
  const rpcFunc = env(daimoChain).rpcFunc;
  const result = await rpcFunc.getAccountHistory.query({
    address: account.address,
    inviteCode: account.inviteLinkStatus?.link.code,
    sinceBlockNum,
  });
  const syncSummary = {
    address: account.address,
    name: account.name,
    sinceBlockNum,
    lastBlock: result.lastBlock,
    lastBlockTimestamp: result.lastBlockTimestamp,
    lastFinalizedBlock: result.lastFinalizedBlock,
    lastBalance: result.lastBalance,
    numTransfers: result.transferLogs.length,
    numNamedAccounts: result.namedAccounts.length,
    numAccountKeys: result.accountKeys.length,
    chainGasConstants: result.chainGasConstants,
    recommendedExchanges: result.recommendedExchanges,
    suggestedActions: result.suggestedActions,
    profilePicture: result.profilePicture,
    inviteLinkStatus: result.inviteLinkStatus,
    invitees: result.invitees,
    notificationRequestStatuses: result.notificationRequestStatuses,
    numExchangeRates: (result.exchangeRates || []).length,
  };
  console.log(`[SYNC] got history ${JSON.stringify(syncSummary)}`);

  // Validation
  assert(result.address === account.address, "wrong address");
  assert(result.sinceBlockNum === sinceBlockNum, "wrong sinceBlockNum");
  assert(result.lastBlock >= result.sinceBlockNum, "invalid lastBlock");
  assert(result.lastBlockTimestamp > 0, "invalid lastBlockTimestamp");
  assert(
    result.chainGasConstants.paymasterAddress.length % 2 === 0,
    `invalid paymasterAndData ${result.chainGasConstants.paymasterAddress}`
  );

  return result;
}

function applySync(
  account: Account,
  result: AccountHistoryResult,
  fromScratch: boolean
): Account {
  assert(result.address === account.address);
  if (result.lastFinalizedBlock < account.lastFinalizedBlock) {
    console.log(
      `[SYNC] Server has finalized block ${result.lastFinalizedBlock} < local ${account.lastFinalizedBlock}`
    );
    if (fromScratch) {
      console.log(`[SYNC] NOT skipping sync from scratch`);
    } else {
      console.log(`[SYNC] skipping sync, keeping local account`);
      return account;
    }
  }

  // Sync in recent transfers
  // Start with finalized transfers only
  const oldFinalizedTransfers = account.recentTransfers.filter(
    (t) => t.blockNumber && t.blockNumber < result.sinceBlockNum
  );

  // Add newly onchain transfers
  const recentTransfers = addTransfers(
    oldFinalizedTransfers,
    result.transferLogs
  );

  // Mark finalized
  for (const t of recentTransfers) {
    if (t.blockNumber && t.blockNumber <= result.lastFinalizedBlock) {
      t.status = OpStatus.finalized;
    }
  }

  // Match pending transfers
  const oldPending = account.recentTransfers.filter(
    (t) => t.status === OpStatus.pending
  );

  // Match pending transfers
  // TODO: store validUntil directly on the op
  const stillPending = oldPending.filter(
    (t) =>
      syncFindSameOp({ opHash: t.opHash, txHash: t.txHash }, recentTransfers) ==
        null && t.timestamp + SEND_DEADLINE_SECS > result.lastBlockTimestamp
  );
  recentTransfers.push(...stillPending);

  let namedAccounts: EAccount[];
  if (result.sinceBlockNum === 0) {
    // If resyncing from scratch,  reset named accounts
    namedAccounts = result.namedAccounts;
  } else {
    namedAccounts = addNamedAccounts(
      account.namedAccounts,
      result.namedAccounts
    );
  }

  // Clear pending key rotations
  // If pending rotation was an {add, remove} and slot is {not in, in} result
  // still, its pending
  const stillPendingKeyRotation = account.pendingKeyRotation.filter((r) => {
    const isSlotNotInResult =
      result.accountKeys.find((k) => k.slot === r.slot) == null;
    return r.rotationType === "add" ? isSlotNotInResult : !isSlotNotInResult;
  });

  const ret: Account = {
    ...account,

    lastBalance: BigInt(result.lastBalance),
    lastBlock: result.lastBlock,
    lastBlockTimestamp: result.lastBlockTimestamp,
    lastFinalizedBlock: result.lastFinalizedBlock,

    chainGasConstants: result.chainGasConstants,
    recommendedExchanges: result.recommendedExchanges || [],
    suggestedActions: result.suggestedActions?.filter(
      (a) => !account.dismissedActionIDs.includes(a.id)
    ),

    recentTransfers,
    namedAccounts,
    accountKeys: result.accountKeys || [],
    pendingKeyRotation: stillPendingKeyRotation,
    linkedAccounts: result.linkedAccounts || [],
    profilePicture: result.profilePicture,
    inviteLinkStatus: result.inviteLinkStatus || null,
    invitees: result.invitees || [],
    notificationRequestStatuses: result.notificationRequestStatuses || [],
    proposedSwaps: result.proposedSwaps || [],
    exchangeRates: result.exchangeRates || [],
  };

  console.log(
    `[SYNC] synced ${account.name} ${result.address}.\n` +
      JSON.stringify({
        oldBlock: account.lastBlock,
        oldBalance: amountToDollars(account.lastBalance),
        oldTransfers: account.recentTransfers.length,
        newBlock: result.lastBlock,
        newBalance: amountToDollars(BigInt(result.lastBalance)),
        newTransfers: recentTransfers.length,
        nPending: recentTransfers.filter((t) => t.status === OpStatus.pending)
          .length,
      })
  );
  return ret;
}

export function syncFindSameOp(
  id: PendingOpEvent,
  ops: DisplayOpEvent[]
): DisplayOpEvent | null {
  return (
    ops.find(
      (r) =>
        (id.opHash && id.opHash === r.opHash) ||
        (id.txHash && id.txHash === r.txHash)
    ) || null
  );
}

/** Update contacts based on recent interactions */
function addNamedAccounts(old: EAccount[], found: EAccount[]): EAccount[] {
  const ret = [...old];
  const addrs = new Set(old.map((na) => na.addr));

  for (const na of found) {
    if (addrs.has(na.addr)) continue;
    addrs.add(na.addr);
    ret.push(na);
  }

  if (ret.length !== old.length) {
    console.log(`[SYNC] added ${ret.length - old.length} new contacts`);
  }

  return ret;
}

/** Add transfers based on new Transfer event logs */
function addTransfers(
  old: DisplayOpEvent[],
  logs: DisplayOpEvent[]
): DisplayOpEvent[] {
  // Sort new logs
  logs.sort((a, b) => {
    if (a.blockNumber !== b.blockNumber) return a.blockNumber! - b.blockNumber!;
    return a.logIndex! - b.logIndex!;
  });

  // old finalized logs + new logs
  return [...old, ...logs];
}
