import { NamedAccount, TransferLog } from "@daimo/api";
import { useEffect } from "react";

import { assert } from "../logic/assert";
import { chainConfig } from "../logic/chain";
import { rpcFunc } from "../logic/trpc";
import { useAccount } from "../model/account";
import { AccountHistory, useAccountHistory } from "../model/accountHistory";
import { TransferOp } from "../model/op";

export function useSyncAccountHistory() {
  const [account] = useAccount();
  const address = account?.address;

  const [hist, setHist] = useAccountHistory(address);

  useEffect(() => {
    if (!hist) return;
    assert(hist.address === address);

    syncAccountHistory(hist).then(setHist).catch(console.error);
  }, [hist?.address, hist?.lastFinalizedBlock]);
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
  // Delete transfers that were potentially reverted to avoid dupes
  const oldFinalizedTransfers = hist.recentTransfers.filter(
    (t) => t.blockNumber == null || t.blockNumber < hist.lastFinalizedBlock
  );

  const recentTransfers = updateTransfers(
    oldFinalizedTransfers,
    result.transferLogs
  );

  const contacts = updateContacts(hist.contacts, result.namedAddrs);

  const ret: AccountHistory = {
    address: result.address,
    lastFinalizedBlock: result.lastFinalizedBlock,
    recentTransfers,
    contacts,
  };

  console.log(
    `[SYNC] synced history for ${result.address}. Old: ${hist.recentTransfers.length} transfers, new: ${recentTransfers.length}`
  );
  return ret;
}

type Contact = NamedAccount;

/** Update contacts based on recent interactions */
function updateContacts(old: Contact[], found: Contact[]): Contact[] {
  const ret = [...old];

  // TODO: better algo
  for (const na of found) {
    if (na.name == null) continue;
    if (ret.find((c) => c.addr === na.addr)) continue;
    ret.push(na);
  }

  if (ret.length !== old.length) {
    console.log(`[SYNC] added ${ret.length - old.length} new contacts`);
  }

  return ret;
}

/** Update transfer based on new Transfer logs */
function updateTransfers(old: TransferOp[], logs: TransferLog[]): TransferOp[] {
  const ret = [...old];

  // TODO: match existing pending transfers, update them

  // Add new transfers since previous lastFinalizedBlock
  for (const transfer of logs) {
    ret.push({
      type: "transfer",
      status: "confirmed",

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

  // TODO: mark finalized

  return ret;
}

function guessTimestampFromNum(blockNum: number) {
  switch (chainConfig.l2.network) {
    case "base-goerli":
      return 1675193616 + blockNum * 2;
    default:
      throw new Error(`Unsupported network: ${chainConfig.l2.network}`);
  }
}
