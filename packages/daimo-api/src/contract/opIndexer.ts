import { DaimoNonce, DaimoNonceMetadata } from "@daimo/userop";
import { Pool } from "pg";
import { Hex, numberToHex } from "viem";

interface UserOp {
  transactionHash: Hex;
  logIndex: number;
  nonce: bigint;
  hash: Hex;
}

/* User operation indexer. Used to track fulfilled requests. */
export class OpIndexer {
  private txHashToSortedUserOps: Map<Hex, UserOp[]> = new Map();
  private nonceMetadataToTxes: Map<Hex, Hex[]> = new Map();

  async load(pg: Pool, from: bigint, to: bigint) {
    const result = await pg.query(
      `
        select
          encode(tx_hash, 'hex') as tx_hash,
          log_idx,
          op_nonce,
          encode(op_hash, 'hex') as hash
        from erc4337_user_op 
        where block_num >= $1 and block_num <= $2
      `,
      [from, to]
    );
    result.rows.forEach((log) => {
      if (!log.tx_hash) return;
      const curLogs = this.txHashToSortedUserOps.get(log.transactionHash);
      const newLogs = curLogs ? [...curLogs, log] : [log];
      this.txHashToSortedUserOps.set(
        log.transactionHash,
        newLogs.sort((a, b) => a.logIndex - b.logIndex)
      );

      const nonceMetadata = DaimoNonce.fromHex(
        numberToHex(log.nonce, { size: 32 })
      )?.metadata.toHex();
      if (!nonceMetadata) return;

      const curTxes = this.nonceMetadataToTxes.get(nonceMetadata);
      const newTxes = curTxes
        ? [...curTxes, log.transactionHash]
        : [log.transactionHash];
      this.nonceMetadataToTxes.set(nonceMetadata, newTxes);
    });
  }

  /**
   * Interpret a (txHash, queryLogIndex) as having originated from a userop and fetch the userop log of it.
   */
  fetchUserOpLog(txHash: Hex, queryLogIndex: number): UserOp | undefined {
    const possibleLogs = this.txHashToSortedUserOps.get(txHash) || [];
    for (const log of possibleLogs) {
      if (log.logIndex > queryLogIndex) {
        return log;
      }
    }
    return undefined;
  }

  /**
   * Interpret a (txHash, queryLogIndex) as having originated from a Daimo Account userop and fetch the nonce metadata of it.
   */
  fetchNonceMetadata(txHash: Hex, queryLogIndex: number): Hex | undefined {
    const log = this.fetchUserOpLog(txHash, queryLogIndex);
    if (!log) return undefined;
    return DaimoNonce.fromHex(
      numberToHex(log.nonce, { size: 32 })
    )?.metadata.toHex();
  }

  /**
   * Fetch all transaction hashes that match the queried nonce metadata.
   */
  fetchTxHashes(nonceMetadata: DaimoNonceMetadata): Hex[] {
    return this.nonceMetadataToTxes.get(nonceMetadata.toHex()) ?? [];
  }
}
