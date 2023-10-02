import { entryPointABI } from "@daimo/contract";
import { DaimoNonce, DaimoNonceMetadata } from "@daimo/userop";
import { Constants } from "userop";
import { Hex, Log, getAbiItem, numberToHex } from "viem";

import { ViemClient } from "../chain";

const userOperationEvent = getAbiItem({
  abi: entryPointABI,
  name: "UserOperationEvent",
});
export type userOperationLog = Log<
  bigint,
  number,
  false,
  typeof userOperationEvent,
  true
>;

/* User operation indexer. Used to track fulfilled requests. */
export class OpIndexer {
  private txHashToSortedUserOps: Map<Hex, userOperationLog[]> = new Map();
  private nonceMetadataToTxes: Map<Hex, Hex[]> = new Map();

  constructor(private client: ViemClient) {}

  async init() {
    await this.client.pipeLogs(
      {
        address: Constants.ERC4337.EntryPoint as Hex,
        event: userOperationEvent,
      },
      this.parseLogs
    );
  }

  private parseLogs = (logs: userOperationLog[]) => {
    for (const log of logs) {
      if (log.transactionHash) {
        const curLogs = this.txHashToSortedUserOps.get(log.transactionHash);
        const newLogs = curLogs ? [...curLogs, log] : [log];
        this.txHashToSortedUserOps.set(
          log.transactionHash,
          newLogs.sort((a, b) => a.logIndex - b.logIndex)
        );

        const nonceMetadata = DaimoNonce.fromHex(
          numberToHex(log.args.nonce, { size: 32 })
        )?.metadata.toHex();
        if (!nonceMetadata) continue;

        const curTxes = this.nonceMetadataToTxes.get(nonceMetadata);
        const newTxes = curTxes
          ? [...curTxes, log.transactionHash]
          : [log.transactionHash];
        this.nonceMetadataToTxes.set(nonceMetadata, newTxes);
      }
    }
  };

  /**
   * Interpret a (txHash, queryLogIndex) as having originated from a Daimo Account userop and fetch the nonce metadata of it.
   */
  fetchNonceMetadata(txHash: Hex, queryLogIndex: number): Hex | undefined {
    const possibleLogs = this.txHashToSortedUserOps.get(txHash) || [];
    for (const log of possibleLogs) {
      if (log.logIndex > queryLogIndex) {
        return DaimoNonce.fromHex(
          numberToHex(log.args.nonce, { size: 32 })
        )?.metadata.toHex();
      }
    }
    return undefined;
  }

  /**
   * Fetch all transaction hashes that match the queried nonce metadata.
   */
  fetchTxHashes(nonceMetadata: DaimoNonceMetadata): Hex[] {
    return this.nonceMetadataToTxes.get(nonceMetadata.toHex()) ?? [];
  }
}
