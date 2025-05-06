import type { AccountHistoryResult } from "@daimo/api";
import {
  EAccount,
  OpStatus,
  PendingOp,
  TransferClog,
  amountToDollars,
  assert,
  assertNotNull,
  now,
} from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import * as SplashScreen from "expo-splash-screen";

import { getNetworkState, updateNetworkState } from "./networkState";
import { addLandlineTransfers } from "./syncLandline";
import { i18NLocale } from "../i18n";
import { getAccountManager } from "../logic/accountManager";
import { SEND_DEADLINE_SECS } from "../logic/opSender";
import { getRpcFunc } from "../logic/trpc";
import { Account } from "../storage/account";

/**
 * Sync strategy:
 * - On app load, load account from storage
 * - Then, sync from API
 * - After, sync from API:
 * - ...immediately on push notification
 * - ...frequently while there's a pending transaction
 * - ...occasionally otherwise
 */
export function startSync() {
  console.log("[SYNC] APP LOAD, starting sync");
  maybeSync(true)
    .then((status) => {
      if (status !== "failed") return;
      updateNetworkState(() => ({ status: "offline", syncAttemptsFailed: 1 }));
    })
    .finally(() => SplashScreen.hideAsync());
  setInterval(maybeSync, 1_000);
}

let lastSyncS = 0;
let lastPushNotificationS = 0;

/** Sync more frequently for a few seconds after each push notification. */
export function syncAfterPushNotification() {
  lastPushNotificationS = now();
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

function hasPendingOps(account: Account) {
  return (
    account.recentTransfers.find((t) => t.status === "pending") != null ||
    account.pendingKeyRotation.length > 0
  );
}

function hasCacheExpiredSwaps(account: Account) {
  return account.proposedSwaps.some((s) => s.cacheUntil < now());
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
  const rpcFunc = getRpcFunc(daimoChain);
  const result = await rpcFunc.getAccountHistory.query({
    address: account.address,
    inviteCode: account.inviteLinkStatus?.link.code,
    sinceBlockNum,
    lang: i18NLocale.languageCode || undefined,
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
    numInvitees: result.invitees.length,
    notificationRequestStatuses: result.notificationRequestStatuses,
    numExchangeRates: (result.exchangeRates || []).length,
    landlineSessionURL: result.landlineSessionURL,
    numLandlineAccounts: (result.landlineAccounts || []).length,
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
    landlineSessionURL: result.landlineSessionURL || "",
    landlineAccounts: result.landlineAccounts || [],
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
        nNotifReqStatuses: account.notificationRequestStatuses.length,
      })
  );
  return ret;
}

export function syncFindSameOp(
  id: PendingOp,
  ops: TransferClog[]
): TransferClog | null {
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
  oldLogs: TransferClog[],
  newLogs: TransferClog[]
): TransferClog[] {
  const { logs, remaining } = addLandlineTransfers(oldLogs, newLogs);

  logs.push(...remaining);

  // Sort logs. Timestamp is determined by block number for on-chain txs.
  // If timestamp is the same, sort by log index to ensure determinism.
  logs.sort((a, b) => {
    const diff = a.timestamp - b.timestamp;
    if (diff !== 0) return diff;
    return (a.logIndex || 0) - (b.logIndex || 0);
  });

  return logs;
}
