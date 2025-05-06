import {
  assert,
  LandlineTransfer,
  landlineTransferToOffchainTransfer,
  landlineTransferToTransferClog,
  TransferClog,
  TransferSwapClog,
} from "@daimo/common";
import { DaimoChain } from "@daimo/contract";

/**
 * Matches and merges landline transfers its corresponding transfer clog, so
 * that the off-chain and on-chain parts of the landline transfer are
 * represented by a single clog.
 *
 * Matching strategy:
 * - (FastFinish transfers, tx not yet landed.) If a landline transfer has a tx
 *   hash which does NOT match, add it as a pending transfer.
 * - (Completed transfers.) If a landline transfer has a tx hash which matches a
 *   TransferSwapClog, that transfer will be merged with the landline transfer.
 * - (Pending offchain, no FastFinish.) Otherwise, a new TransferClog will be
 *   created for the landline transfer. Shows an ETA: ~several business days.
 */
export function addLandlineTransfers(
  llTransfers: LandlineTransfer[],
  transferClogs: TransferClog[],
  chain: DaimoChain
): TransferClog[] {
  const fullTransferClogs: TransferClog[] = [];

  // First, index by txHash
  const hashToLandlineTransfer = new Map(
    llTransfers.filter((lt) => lt.txHash != null).map((lt) => [lt.txHash, lt])
  );
  const hashToClog = new Map(
    transferClogs.filter((t) => t.txHash != null).map((t) => [t.txHash, t])
  );

  // Add all unmatched Landline transfers = PENDING or PROCESSING
  for (const llTransfer of llTransfers) {
    if (llTransfer.txHash != null && hashToClog.has(llTransfer.txHash)) {
      continue; // LL transfer matches an onchain transfer, handled below.
    }
    const isPending = llTransfer.txHash != null; // FastFinish about to hit.
    const clog = landlineTransferToTransferClog(llTransfer, chain, isPending);
    fullTransferClogs.push(clog);
  }

  // Add all transfer clogs, Landline or otherwise.
  for (const transfer of transferClogs) {
    const { txHash, type } = transfer;
    const llTransfer =
      txHash == null ? null : hashToLandlineTransfer.get(txHash);
    if (llTransfer != null) {
      // LL CONFIRMED: Landline transfers matched to TransferSwapClogs
      assert(type === "transfer", `LL matched non-transfer tx ${txHash}`);
      fullTransferClogs.push(mergeLandlineTransfer(llTransfer, transfer));
    } else {
      // ALL OTHER TRANSFERS: non-landline transfer of any kind
      fullTransferClogs.push(transfer);
    }
  }

  return fullTransferClogs.sort((a, b) => a.timestamp - b.timestamp);
}

function mergeLandlineTransfer(
  landlineTransfer: LandlineTransfer,
  transferClog: TransferSwapClog
): TransferClog {
  const offchainTransfer = landlineTransferToOffchainTransfer(landlineTransfer);
  return {
    ...transferClog,
    memo: landlineTransfer.memo || transferClog.memo,
    offchainTransfer,
  };
}
