import { DaimoNonce } from "@daimo/userop";
import { Pool } from "pg";
import { Hex, bytesToHex, numberToHex } from "viem";

import { Indexer } from "./indexer";
import { chainConfig } from "../env";
import { retryBackoff } from "../utils/retryBackoff";

export interface UserOp {
  transactionHash: Hex;
  logIndex: number;
  nonce: bigint;
  hash: Hex;
}

type OpCallback = (userOp: UserOp) => void;

/* User operation indexer. Used to track fulfilled requests. */
export class OpIndexer extends Indexer {
  private txHashToSortedUserOps: Map<Hex, UserOp[]> = new Map();
  private callbacks: Map<Hex, OpCallback[]> = new Map();

  constructor() {
    super("OP");
  }

  addCallback(hash: Hex, cb: OpCallback) {
    const cbs = this.callbacks.get(hash);
    if (!cbs) {
      this.callbacks.set(hash, [cb]);
      return;
    }
    cbs.push(cb);
  }

  callback(userOp: UserOp) {
    const cbs = this.callbacks.get(userOp.hash);
    if (!cbs) return;
    cbs.forEach((cb) => cb(userOp));
    this.callbacks.delete(userOp.hash);
  }

  async load(pg: Pool, from: number, to: number) {
    const startTime = Date.now();
    const result = await retryBackoff(
      `opIndexer-logs-query-${from}-${to}`,
      () =>
        pg.query(
          `
        select tx_hash, log_idx, op_nonce, op_hash
        from erc4337_user_op
        where block_num >= $1 and block_num <= $2 and chain_id = $3
        and op_sender in (select addr from "names")
      `,
          [from, to, chainConfig.chainL2.id]
        )
    );
    if (result.rows.length === 0) return;
    console.log(
      `[OP] loaded ${result.rows.length} ops in ${Date.now() - startTime}ms`
    );

    if (this.updateLastProcessedCheckStale(from, to)) return;

    result.rows.forEach((row: any) => {
      const userOp: UserOp = {
        transactionHash: bytesToHex(row.tx_hash, { size: 32 }),
        logIndex: row.log_idx,
        nonce: BigInt(row.op_nonce),
        hash: bytesToHex(row.op_hash, { size: 32 }),
      };
      const curLogs = this.txHashToSortedUserOps.get(userOp.transactionHash);
      const newLogs = curLogs ? [...curLogs, row] : [userOp];
      this.txHashToSortedUserOps.set(
        userOp.transactionHash,
        newLogs.sort((a, b) => a.logIndex - b.logIndex)
      );

      const nonceMetadata = DaimoNonce.fromHex(
        numberToHex(userOp.nonce, { size: 32 })
      )?.metadata.toHex();
      if (!nonceMetadata) return;

      this.callback(userOp);
    });
    console.log(
      `[OP] processed ${result.rows.length} ops in ${Date.now() - startTime}ms`
    );
  }

  /**
   * Interpret an event log as having originated from a userop, find the userop.
   */
  fetchUserOpFromEventLog(log: { transactionHash: Hex; logIndex: number }) {
    return this.fetchUserOpLog(log.transactionHash, log.logIndex);
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
}
