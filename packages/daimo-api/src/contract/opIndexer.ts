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
  private txHashToUserOp: Map<Hex, userOperationLog> = new Map();
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
        this.txHashToUserOp.set(log.transactionHash, log);

        const nonceMetadata = DaimoNonce.fromHex(
          numberToHex(log.args.nonce)
        ).metadata.toHex();
        const curTxes = this.nonceMetadataToTxes.get(nonceMetadata);
        const newTxes = curTxes
          ? [...curTxes, log.transactionHash]
          : [log.transactionHash];
        this.nonceMetadataToTxes.set(nonceMetadata, newTxes);
      }
    }
  };

  /**
   * Interpret a transaction as a Daimo Account userop and fetch the nonce metadata of it.
   */
  fetchNonceMetadata(txHash: Hex): Hex | undefined {
    const log = this.txHashToUserOp.get(txHash);

    if (!log) return undefined;
    const nonce = DaimoNonce.fromHex(numberToHex(log.args.nonce));

    return nonce.metadata.toHex();
  }

  /**
   * Fetch all transaction hashes that match the queried nonce metadata.
   */
  fetchTxHashes(nonceMetadata: DaimoNonceMetadata): Hex[] {
    return this.nonceMetadataToTxes.get(nonceMetadata.toHex()) ?? [];
  }
}
