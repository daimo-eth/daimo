import {
  LandlineTransfer,
  landlineTransferToOffchainTransfer,
  OpStatus,
  TransferClog,
  TransferSwapClog,
  dateStringToUnixSeconds,
  guessNumFromTimestamp,
} from "@daimo/common";
import { DaimoChain } from "@daimo/contract";
import { Hex, parseUnits } from "viem";

// Use a coinbase address so that old versions of the mobile app will show
// coinbase as the sender for landline deposits
const DEFAULT_LANDLINE_ADDRESS = "0x1985EA6E9c68E1C272d8209f3B478AC2Fdb25c87";

export function addLandlineTransfers(
  landlineTransfers: LandlineTransfer[],
  transferClogs: TransferClog[],
  chain: DaimoChain
): TransferClog[] {
  const fullTransferClogs: TransferClog[] = [];

  const hashToLandlineTransfer = new Map<Hex, LandlineTransfer>();
  for (const landlineTransfer of landlineTransfers) {
    if (landlineTransfer.txHash) {
      hashToLandlineTransfer.set(landlineTransfer.txHash, landlineTransfer);
    } else {
      // No tx hash, so it can't be matched to a transfer clog.
      // Create a new TransferClog for it.
      fullTransferClogs.push(
        landlineTransferToClog(landlineTransfer, chain, undefined)
      );
    }
  }

  // Go through each transfer clog and see if it's matched to a landline transfer.
  for (const transfer of transferClogs) {
    if (transfer.txHash && hashToLandlineTransfer.has(transfer.txHash)) {
      // Landline transfers can only be matched to TransferSwapClogs
      if (transfer.type !== "transfer") {
        throw new Error("Expected transfer to be of type 'transfer'");
      }

      const landlineTransfer = hashToLandlineTransfer.get(transfer.txHash);
      fullTransferClogs.push(
        landlineTransferToClog(landlineTransfer!, chain, undefined)
      );
      hashToLandlineTransfer.delete(transfer.txHash);
    } else {
      fullTransferClogs.push(transfer);
    }
  }

  // Add the un-matched landline transfers in hashToLandlineTransfer
  for (const [, landlineTransfer] of hashToLandlineTransfer.entries()) {
    fullTransferClogs.push(
      landlineTransferToClog(landlineTransfer, chain, undefined)
    );
  }

  return fullTransferClogs.sort((a, b) => a.timestamp - b.timestamp);
}

function landlineTransferToClog(
  landlineTransfer: LandlineTransfer,
  chain: DaimoChain,
  transferClog?: TransferSwapClog
): TransferClog {
  const offchainTransfer = landlineTransferToOffchainTransfer(landlineTransfer);
  let newTransferClog = transferClog;

  // Create a new TransferSwapClog from the landline transfer data
  if (!newTransferClog) {
    const timestamp = dateStringToUnixSeconds(landlineTransfer.createdAt);
    newTransferClog = {
      timestamp,
      // Set status as confirmed otherwise old versions of the app will
      // clear the pending transfer after a while
      status: OpStatus.confirmed,
      txHash: landlineTransfer.txHash || undefined,
      // Old versions of the mobile app use blockNumber and logIndex to sort
      // TransferClogs. Block number is also used to determine finalized transfers.
      blockNumber: guessNumFromTimestamp(timestamp, chain),
      logIndex: 0,

      type: "transfer",
      from: landlineTransfer.fromAddress || DEFAULT_LANDLINE_ADDRESS,
      to: landlineTransfer.toAddress || DEFAULT_LANDLINE_ADDRESS,
      amount: Number(parseUnits(landlineTransfer.amount, 6)),
      memo: landlineTransfer.memo || undefined,
    };
  }

  newTransferClog.offchainTransfer = offchainTransfer;
  return newTransferClog;
}
