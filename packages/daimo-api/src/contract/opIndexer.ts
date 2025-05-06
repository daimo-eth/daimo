import { assertNotNull, retryBackoff } from "@daimo/common";
import { DaimoNonce } from "@daimo/userop";
import { Kysely } from "kysely";
import { Hex, bytesToHex, numberToHex } from "viem";

import { ClogMatcher } from "./ClogMatcher";
import { Indexer } from "./indexer";
import { DB as IndexDB } from "../codegen/dbIndex";
import { chainConfig } from "../env";

export interface UserOp {
  blockNumber: bigint;
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

  constructor(private clogMatcher: ClogMatcher) {
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

  async load(kdb: Kysely<IndexDB>, from: number, to: number) {
    const startTime = Date.now();

    const result = await retryBackoff(
      `opIndexer-logs-query-${from}-${to}`,
      () =>
        kdb
          .selectFrom("index.daimo_op")
          .select(["block_num", "tx_hash", "log_idx", "op_nonce", "op_hash"])
          .where((eb) => eb.between("block_num", "" + from, "" + to))
          .where("chain_id", "=", "" + chainConfig.chainL2.id)
          .execute()
    );
    if (result.length === 0) return;

    let elapsedMs = (Date.now() - startTime) | 0;
    console.log(`[OP] loaded ${result.length} ops in ${elapsedMs}ms`);

    if (this.updateLastProcessedCheckStale(from, to)) return;

    const txHashes = new Set<Hex>();
    result.forEach((row) => {
      const userOp: UserOp = {
        blockNumber: BigInt(row.block_num),
        transactionHash: bytesToHex(assertNotNull(row.tx_hash), { size: 32 }),
        logIndex: Number(assertNotNull(row.log_idx)),
        nonce: BigInt(assertNotNull(row.op_nonce)),
        hash: bytesToHex(assertNotNull(row.op_hash), { size: 32 }),
      };
      const curLogs = this.txHashToSortedUserOps.get(userOp.transactionHash);
      const newLogs = curLogs ? [...curLogs, userOp] : [userOp];
      this.txHashToSortedUserOps.set(
        userOp.transactionHash,
        newLogs.sort((a, b) => a.logIndex - b.logIndex)
      );

      const nonceMetadata = DaimoNonce.fromHex(
        numberToHex(userOp.nonce, { size: 32 })
      )?.metadata.toHex();
      if (!nonceMetadata) return;

      this.callback(userOp);
      txHashes.add(userOp.transactionHash);
    });

    elapsedMs = (Date.now() - startTime) | 0;
    console.log(`[OP] processed ${result.length} ops in ${elapsedMs}ms`);

    this.clogMatcher.loadClogTransfers(
      kdb,
      from,
      to,
      chainConfig.chainL2.id,
      txHashes
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
