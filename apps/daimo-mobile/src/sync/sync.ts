import { NamedAccount, TransferLogSummary } from "@daimo/api";
import {
  OpStatus,
  TransferOpEvent,
  amountToDollars,
  assert,
} from "@daimo/common";
import { useEffect } from "react";

import { chainConfig } from "../logic/chainConfig";
import { rpcFunc } from "../logic/trpc";
import { Account, getAccountManager } from "../model/account";

// Sync strategy:
// - On app load, load account from storage
// - Then, sync from API
// - After, sync from API:
//   ...immediately on push notification
//   ...frequently while there's a pending transaction
//   ...occasionally otherwise
//
// TODO: better sync strategy:
// - On app load, load account from storage
// - Connect to API websocket. Listen for updates.
export function useSyncChain() {
  // Sync on app load, then periodically after
  useEffect(() => {
    console.log("[SYNC] APP LOAD, starting sync");
    maybeSync();
    const int = window.setInterval(maybeSync, 1_000);
    return () => window.clearInterval(int);
  }, []);
}

let lastSyncS = 0;

function maybeSync() {
  const manager = getAccountManager();
  if (manager.currentAccount == null) return;
  const account = manager.currentAccount;

  // Synced recently? Wait first.
  const nowS = Date.now() / 1e3;
  let intervalS = 30;
  if (account.recentTransfers.find((t) => t.status === "pending") != null) {
    intervalS = 1;
  }
  if (lastSyncS + intervalS > nowS) {
    console.log(`[SYNC] skipping sync, attempted sync recently`);
  } else {
    resync(`interval ${intervalS}s`);
  }
}

/** Gets latest balance & history for this account, in the background. */
export function resync(reason: string) {
  const { currentAccount, setCurrentAccount } = getAccountManager();
  assert(currentAccount != null, "no account");

  console.log(`[SYNC] RESYNC ${currentAccount.name}, ${reason}`);
  lastSyncS = Date.now() / 1e3;

  const acc = currentAccount;
  syncAccount(acc)
    .then((a: Account) => {
      console.log(`[SYNC] SUCCEEDED ${acc.name}`);
      setCurrentAccount(a);
    })
    .catch((e) => {
      console.error(`[SYNC] FAILED ${acc.name}`, e);
      setCurrentAccount({ ...acc });
    });
}

/** Loads all account history since the last finalized block as of the previous sync.
 * This means we're guaranteed to see all events even if there were reorgs. */
async function syncAccount(account: Account) {
  const result = await rpcFunc.getAccountHistory.query({
    address: account.address,
    sinceBlockNum: account.lastFinalizedBlock,
  });
  console.log(`[SYNC] got account update for ${account.name}`, result);

  assert(result.address === account.address);
  if (result.lastFinalizedBlock < account.lastFinalizedBlock) {
    console.log(
      `[SYNC] skipping sync result for ${account.address}. Server has finalized ` +
        `block ${result.lastFinalizedBlock} < local ${account.lastFinalizedBlock}`
    );
    return account;
  }

  // Sync in recent transfers
  // Start with finalized transfers only
  const oldFinalizedTransfers = account.recentTransfers.filter(
    (t) => t.blockNumber && t.blockNumber < account.lastFinalizedBlock
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
    (t) => t.status === "pending"
  );
  const stillPending = oldPending.filter(
    (t) =>
      recentTransfers.find(
        (r) => t.from === r.from && t.to === r.to && t.amount === r.amount
      ) == null
  );
  recentTransfers.push(...stillPending);

  const namedAccounts = addNamedAccounts(
    account.namedAccounts,
    result.namedAccounts
  );

  const ret: Account = {
    ...account,

    lastBalance: BigInt(result.lastBalance),
    lastBlock: result.lastBlock,
    lastBlockTimestamp: result.lastBlockTimestamp,
    lastFinalizedBlock: result.lastFinalizedBlock,

    recentTransfers,
    namedAccounts,
  };

  console.log(
    `[SYNC] synced ${account.name} ${result.address}.\n` +
      JSON.stringify(
        {
          oldBlock: account.lastBlock,
          oldBalance: amountToDollars(account.lastBalance),
          oldTransfers: account.recentTransfers.length,
          newBlock: result.lastBlock,
          newBalance: amountToDollars(BigInt(result.lastBalance)),
          newTransfers: recentTransfers.length,
        },
        null,
        2
      )
  );
  return ret;
}

/** Update contacts based on recent interactions */
function addNamedAccounts(
  old: NamedAccount[],
  found: NamedAccount[]
): NamedAccount[] {
  const ret = [...old];
  const addrs = new Set(old.map((na) => na.addr));

  for (const na of found) {
    if (na.name == null) continue;
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
  old: TransferOpEvent[],
  logs: TransferLogSummary[]
): TransferOpEvent[] {
  // Start with old, finalized transfers
  const ret = [...old];

  // Sort new logs
  logs.sort((a, b) => {
    if (a.blockNum !== b.blockNum) return a.blockNum - b.blockNum;
    return a.logIndex - b.logIndex;
  });

  // Add new transfers since previous lastFinalizedBlock
  for (const transfer of logs) {
    ret.push({
      type: "transfer",
      status: OpStatus.confirmed,

      from: transfer.from,
      to: transfer.to,
      amount: Number(transfer.amount),

      timestamp: guessTimestampFromNum(transfer.blockNum),
      txHash: transfer.txHash,
      blockNumber: transfer.blockNum,
      blockHash: transfer.blockHash,
      logIndex: transfer.logIndex,
    });
  }

  return ret;
}

/** On L2, timestamp can be a deterministic function of block number. */
function guessTimestampFromNum(blockNum: number) {
  switch (chainConfig.l2.network) {
    case "base-goerli":
      return 1675193616 + blockNum * 2;
    default:
      throw new Error(`Unsupported network: ${chainConfig.l2.network}`);
  }
}
