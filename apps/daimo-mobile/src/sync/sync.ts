import { useEffect } from "react";

import { assert } from "../logic/assert";
import { chainConfig } from "../logic/chain";
import { rpcFunc } from "../logic/trpc";
import { useAccount } from "../model/account";
import { AccountHistory, useAccountHistory } from "../model/accountHistory";

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
  const recentTransfers = hist.recentTransfers.filter(
    (t) => t.blockNumber == null || t.blockNumber < hist.lastFinalizedBlock
  );

  // TODO: match existing pending transfers, update them

  // Add new transfers since previous lastFinalizedBlock
  for (const transfer of result.transferLogs) {
    recentTransfers.push({
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

  const ret: AccountHistory = {
    address: result.address,
    lastFinalizedBlock: result.lastFinalizedBlock,
    recentTransfers,
  };

  console.log(
    `[SYNC] synced history for ${result.address}. Old: ${hist.recentTransfers.length} transfers, new: ${recentTransfers.length}`
  );
  return ret;
}

function guessTimestampFromNum(blockNum: number) {
  switch (chainConfig.l2.network) {
    case "base-goerli":
      return 1675218816 + blockNum * 2;
    default:
      throw new Error(`Unsupported network: ${chainConfig.l2.network}`);
  }
}
