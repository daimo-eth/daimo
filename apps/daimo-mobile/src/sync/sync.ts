import { AccountHistoryResult } from "@daimo/api";
import {
  TransferClog,
  EAccount,
  OpStatus,
  PendingOpEvent,
  amountToDollars,
  assert,
  assertNotNull,
} from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";

import { updateNetworkState, updateNetworkStateOnline } from "./networkState";
import { getAccountManager } from "../logic/accountManager";
import { SEND_DEADLINE_SECS } from "../logic/opSender";
import { getRpcFunc } from "../logic/trpc";
import { Account } from "../storage/account";

class SyncManager {
  manager = getAccountManager();
  currentAccount: Account | null = null;

  private _trpcUnsubscribe: (() => void) | null = null;

  start() {
    this.manager.addListener(this._onAccountChange);
  }

  stop() {
    this.manager.removeListener(this._onAccountChange);

    this.unsubscribe();
  }

  subscribe(account: Account) {
    const daimoChain = daimoChainFromId(account.homeChainId);
    const rpcFunc = getRpcFunc(daimoChain);

    this.currentAccount = account;

    const sub = rpcFunc.onAccountUpdate.subscribe(
      {
        address: account.address,
        sinceBlockNum: 0,
      },
      {
        onStarted: () => {
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

  const manager = new SyncManager();

  manager.start();

  return manager;
}

/** Gets latest balance & history for this account, in the background. */
export async function resync(reason: string, fromScratch?: boolean) {
  const manager = getAccountManager();
  const accOld = manager.getAccount();
  assert(!!accOld, `no account, skipping sync: ${reason}`);

  console.log(`[RESYNC] New ${accOld.name}, ${reason}`);

  try {
    const res = await fetchSync(accOld, fromScratch);
    assertNotNull(manager.getAccount(), "deleted during sync");

    manager.transform((a) => applySync(a, res, !!fromScratch));
    console.log(`[RESYNC] SUCCEEDED ${accOld.name}`);
  } catch (e) {
    console.error(`[RESYNC] FAILED ${accOld.name}`, e);
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
    landlineSessionKey: result.landlineSessionKey,
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
    landlineSessionKey: result.landlineSessionKey || "",
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
  id: PendingOpEvent,
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
  old: TransferClog[],
  logs: TransferClog[]
): TransferClog[] {
  // Sort new logs
  logs.sort((a, b) => {
    if (a.blockNumber !== b.blockNumber) return a.blockNumber! - b.blockNumber!;
    return a.logIndex! - b.logIndex!;
  });

  // old finalized logs + new logs
  return [...old, ...logs];
}
