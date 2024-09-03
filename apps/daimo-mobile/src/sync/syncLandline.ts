import {
  TransferClog,
  TransferSwapClog,
  getTransferClogType,
} from "@daimo/common";

/**
 * All old landline clogs should be bundled into a single clog with the most
 * up-to-date offchainTransfer.
 *
 * Landline TransferClog sync strategy:
 *  1. If an old log matches by tx hash, then it is the on-chain counterpart
 *     of the incoming landline clog. Keep the on-chain part of the clog and
 *     update the offchainTransfer to the incoming landline clog's.
 *  2. If an old log matches by just the transferID, then it is a potentially
 *     outdated landline clog. Replace the old clog with the incoming landline clog.
 */
export function addLandlineTransfers(
  oldLogs: TransferClog[],
  newLogs: TransferClog[]
): {
  logs: TransferClog[];
  remaining: TransferClog[];
} {
  // Separate new landline clogs from other clogs
  const landlineLogs: TransferSwapClog[] = [];
  const remainingLogs: TransferClog[] = [];
  for (const log of newLogs) {
    if (getTransferClogType(log) === "landline") {
      landlineLogs.push(log as TransferSwapClog);
    } else {
      remainingLogs.push(log);
    }
  }

  // Flag to mark which old logs have been replaced by a landline log
  const replacedOldLog: boolean[] = Array(oldLogs.length).fill(false);

  const updatedLandlineLogs: TransferSwapClog[] = [];
  for (const landlineLog of landlineLogs) {
    const matchingTransfers: TransferSwapClog[] = [];
    for (let i = 0; i < oldLogs.length; i++) {
      const oldLog = oldLogs[i];
      if (
        getTransferClogType(oldLog) !== "landline" &&
        getTransferClogType(oldLog) !== "transfer"
      ) {
        continue;
      }

      const oldSwapLog = oldLog as TransferSwapClog;

      // All old logs which represent the same landline transfer should be replaced
      if (landlineLog.txHash && oldSwapLog.txHash === landlineLog.txHash) {
        matchingTransfers.push(oldSwapLog);
        replacedOldLog[i] = true;
      } else if (
        oldSwapLog.offchainTransfer?.transferID ===
        landlineLog.offchainTransfer!.transferID
      ) {
        replacedOldLog[i] = true;
      }
    }

    // Replace all old logs with a single updated landline log
    if (matchingTransfers.length > 0) {
      const updatedLog: TransferSwapClog = {
        ...matchingTransfers[matchingTransfers.length - 1],
        offchainTransfer: landlineLog.offchainTransfer,
      };
      updatedLandlineLogs.push(updatedLog);
    } else {
      updatedLandlineLogs.push(landlineLog);
    }
  }

  const allLogs: TransferClog[] = [];
  for (let i = 0; i < oldLogs.length; i++) {
    if (!replacedOldLog[i]) {
      allLogs.push(oldLogs[i]);
    }
  }
  allLogs.push(...updatedLandlineLogs);

  return { logs: allLogs, remaining: remainingLogs };
}
