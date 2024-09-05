import {
  LandlineTransfer,
  landlineTransferToOffchainTransfer,
  landlineTransferToTransferClog,
  TransferClog,
  TransferSwapClog,
} from "@daimo/common";
import { DaimoChain } from "@daimo/contract";
import { Hex } from "viem";

/**
 * Matches and merges landline transfers its corresponding transfer clog, so
 * that the off-chain and on-chain parts of the landline transfer are
 * represented by a single clog.
 *
 * Matching strategy:
 * - If a landline transfer has a tx hash which matches a TransferSwapClog,
 *   the transfer clog will be merged with the landline transfer.
 * - Otherwise, a new TransferClog will be created for the landline transfer.
 */
export function addLandlineTransfers(
  landlineTransfers: LandlineTransfer[],
  transferClogs: TransferClog[],
  chain: DaimoChain
): TransferClog[] {
  const fullTransferClogs: TransferClog[] = [];

  // Create a map from tx hash to landline transfer
  const hashToLandlineTransfer = new Map<Hex, LandlineTransfer>();
  for (const landlineTransfer of landlineTransfers) {
    if (landlineTransfer.txHash) {
      hashToLandlineTransfer.set(landlineTransfer.txHash, landlineTransfer);
    } else {
      // No tx hash, so it can't be matched to a transfer clog.
      // Create a new TransferClog for it.
      fullTransferClogs.push(
        landlineTransferToTransferClog(landlineTransfer, chain)
      );
    }
  }

  // Go through each transfer clog and see if it's matched to a landline transfer.
  for (const transfer of transferClogs) {
    if (transfer.txHash && hashToLandlineTransfer.has(transfer.txHash)) {
      // Landline transfers can only be matched to TransferSwapClogs
      if (transfer.type !== "transfer") {
        throw new Error(
          `${transfer.txHash} matched with Landline tx hash. Expected clog to be of type "transfer"`
        );
      }

      const landlineTransfer = hashToLandlineTransfer.get(transfer.txHash);
      fullTransferClogs.push(
        mergeLandlineTransfer(landlineTransfer!, transfer)
      );
      hashToLandlineTransfer.delete(transfer.txHash);
    } else {
      fullTransferClogs.push(transfer);
    }
  }

  // Add the un-matched landline transfers in hashToLandlineTransfer
  for (const [, landlineTransfer] of hashToLandlineTransfer.entries()) {
    fullTransferClogs.push(
      landlineTransferToTransferClog(landlineTransfer, chain)
    );
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
    offchainTransfer,
  };
}
