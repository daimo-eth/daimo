import { NamedAccount, TransferLog } from "@daimo/api";
import { useEffect, useMemo, useState } from "react";

import { assert } from "../logic/assert";
import { Chain, ChainStatus, chainConfig } from "../logic/chain";
import { rpcFunc } from "../logic/trpc";
import { useAccount } from "../model/account";
import { AccountHistory, useAccountHistory } from "../model/accountHistory";
import { OpStatus, TransferOpEvent } from "../model/op";

export function useSyncAccountHistory() {
  const [account] = useAccount();
  const address = account?.address;

  const [hist, setHist] = useAccountHistory(address);

  useEffect(() => {
    if (!hist) return;
    assert(hist.address === address);

    resyncAccountHistory(hist, setHist);
  }, [hist?.address, hist?.lastFinalizedBlock]);
}

/** Gets latest history for this account, in the background. */
export function resyncAccountHistory(
  hist: AccountHistory,
  setHist: (h: AccountHistory) => void
) {
  console.log(`[SYNC] RESYNC account balance and history for ${hist.address}`);
  syncAccountHistory(hist).then(setHist).catch(console.error);
  refreshAccount();
}

/** Loads all account history since the last finalized block as of the previous sync.
 * This means we're guaranteed to see all events even if there were reorgs. */
async function syncAccountHistory(hist: AccountHistory) {
  const result = await rpcFunc.getAccountHistory.query({
    address: hist.address,
    sinceBlockNum: hist.lastFinalizedBlock,
  });

  assert(result.address === hist.address);
  assert(result.lastFinalizedBlock >= hist.lastFinalizedBlock);

  // Sync in recent transfers
  // Start with finalized transfers only
  const oldFinalizedTransfers = hist.recentTransfers.filter(
    (t) => t.blockNumber && t.blockNumber < hist.lastFinalizedBlock
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
  const oldPending = hist.recentTransfers.filter((t) => t.status === "pending");
  const stillPending = oldPending.filter(
    (t) =>
      recentTransfers.find(
        (r) =>
          t.from.toLowerCase() === r.from.toLowerCase() &&
          t.to.toLowerCase() === r.to.toLowerCase() &&
          t.amount === r.amount
      ) == null
  );
  recentTransfers.push(...stillPending);

  const namedAccounts = addNamedAccounts(
    hist.namedAccounts,
    result.namedAccounts
  );

  const ret: AccountHistory = {
    address: result.address,
    lastFinalizedBlock: result.lastFinalizedBlock,
    recentTransfers,
    namedAccounts,
  };

  console.log(
    `[SYNC] synced history for ${result.address}. Old: ${hist.recentTransfers.length} transfers, new: ${recentTransfers.length}`
  );
  return ret;
}

/** Update contacts based on recent interactions */
function addNamedAccounts(
  old: NamedAccount[],
  found: NamedAccount[]
): NamedAccount[] {
  const ret = [...old];
  const addrs = new Set(old.map((na) => na.addr.toLowerCase()));

  for (const na of found) {
    if (na.name == null) continue;
    if (addrs.has(na.addr.toLowerCase())) continue;
    addrs.add(na.addr.toLowerCase());
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
  logs: TransferLog[]
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

// TODO: clean up
let refreshAccount = () => {};

export function usePollChain() {
  const [account, setAccount] = useAccount();
  const [status, setStatus] = useState<ChainStatus>({ status: "loading" });
  const chain = useMemo(() => new Chain(), []);

  refreshAccount = async () => {
    try {
      console.log(`[APP] loading chain status...`);
      const status = await chain.getStatus();
      setStatus(status);

      if (!account || status.status !== "ok") return;
      console.log(`[APP] reloading account ${account.address}...`);
      setAccount(await chain.updateAccount(account, status));
    } catch (e) {
      console.error(e);
    }
  };

  // Refresh whenever the account changes, then periodically
  const address = account?.address;
  useEffect(() => {
    refreshAccount();
    const interval = setInterval(refreshAccount, 30000);
    return () => clearInterval(interval);
  }, [address]);

  const cs = useMemo(() => ({ chain, status }), [chain, status]);
  return cs;
}
