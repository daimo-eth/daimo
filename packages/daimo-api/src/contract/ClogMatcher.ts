import {
  assertNotNull,
  bytesToAddr,
  debugJson,
  retryBackoff,
} from "@daimo/common";
import { daimoFastCctpAddrs } from "@daimo/contract";
import { Kysely } from "kysely";
import { Address, bytesToHex, Hex, hexToBytes, zeroAddress } from "viem";

import { ForeignTokenTransfer } from "./foreignCoinIndexer";
import { DB as IndexDB } from "../codegen/dbIndex";
import { chainConfig } from "../env";
import { TokenRegistry } from "../server/tokenRegistry";

/**
 * Finds corresponding information for a given transfer over logs in a tx.
 * For example, a SwapClog and a cross-chain transfer both need to retrieve
 * the actual "to" transfer.
 */
export class ClogMatcher {
  /** Map of transactionHash to transfers within that transaction */
  private txHashToTransfers: Map<string, ForeignTokenTransfer[]> = new Map();

  constructor(private tokenReg: TokenRegistry) {}

  /**
   * Given a set transaction hashes, load any transfers that are associated
   * with those transactions. This includes FastCCTP events, where a Start()
   * event will be transformed into its corresponding transfer.
   */
  async loadClogTransfers(
    kdb: Kysely<IndexDB>,
    from: number,
    to: number,
    chainId: number,
    txHashes: Set<Hex>
  ) {
    const startTime = Date.now();

    const txList = [...txHashes].map((tx) => Buffer.from(hexToBytes(tx)));

    // Load SwapClog transfers
    const transferResult = await retryBackoff(
      `swapClogMatcher-logs-query-${from}-${to}`,
      () =>
        kdb
          .selectFrom("index.daimo_transfer")
          .select([
            "block_hash",
            "block_num",
            "tx_hash",
            "tx_idx",
            "sort_idx",
            "token",
            "f",
            "t",
            "amount",
          ])
          .where("chain_id", "=", "" + chainId)
          .where((e) => e.between("block_num", "" + from, "" + to))
          .where("tx_hash", "in", txList)
          .execute()
    );

    for (const row of transferResult) {
      const transferLog = {
        blockHash: bytesToHex(row.block_hash, { size: 32 }),
        blockNumber: BigInt(row.block_num),
        transactionHash: bytesToHex(row.tx_hash, { size: 32 }),
        transactionIndex: Number(row.tx_idx),
        logIndex: Number(row.sort_idx),
        address: row.token == null ? zeroAddress : bytesToAddr(row.token),
        from: bytesToAddr(row.f),
        to: bytesToAddr(row.t),
        value: BigInt(row.amount),
      };
      const token = this.tokenReg.getToken(transferLog.address, chainId);
      if (token == null) continue;

      const foreignTransfer: ForeignTokenTransfer = {
        ...transferLog,
        foreignToken: token,
      };
      this.txHashToTransfers.set(foreignTransfer.transactionHash, [
        ...(this.txHashToTransfers.get(foreignTransfer.transactionHash) || []),
        foreignTransfer,
      ]);
    }

    // Load FastCCTP Start events and transform into outbound foreign transfers
    const startResult = await retryBackoff(
      `StartFastCctp-logs-query-${from}-${to}`,
      () =>
        kdb
          .selectFrom("index.daimo_fast_cctp")
          .selectAll()
          .where("chain_id", "=", "" + chainConfig.chainL2.id)
          .where((e) => e.between("block_num", "" + from, "" + to))
          .where("tx_hash", "in", txList)
          .where("log_name", "=", "Start")
          .execute()
    );

    for (const row of startResult) {
      const fastCctpLog = {
        blockHash: bytesToHex(row.block_hash, { size: 32 }),
        blockNumber: BigInt(row.block_num),
        transactionHash: bytesToHex(row.tx_hash, { size: 32 }),
        transactionIndex: Number(row.tx_idx),
        logIndex: Number(row.log_idx),
        address: bytesToAddr(row.to_token),
        from: bytesToAddr(assertNotNull(row.from_addr)),
        to: bytesToAddr(row.to_addr),
        value: BigInt(row.to_amount),
      };

      const crossChainToken = this.tokenReg.getToken(
        fastCctpLog.address,
        Number(row.to_chain_id) // cross-chain (to chain)
      );
      if (crossChainToken == null) continue;

      const crossChainTransfer: ForeignTokenTransfer = {
        ...fastCctpLog,
        foreignToken: crossChainToken,
      };
      this.txHashToTransfers.set(crossChainTransfer.transactionHash, [
        ...(this.txHashToTransfers.get(crossChainTransfer.transactionHash) ||
          []),
        crossChainTransfer,
      ]);
    }

    const elapsedMs = (Date.now() - startTime) | 0;
    console.log(
      `[MATCHER] loaded ${transferResult.length} bundled transfers and ${startResult.length} Start FastCCTP events in ${elapsedMs}ms`
    );
  }

  /**
   * For inbound cross-chain transfers, we need to fetch the cross-chain event
   * that initiated the transfer (i.e. the corresponding Start <> FastFinish).
   */
  async loadCrossChainClogs(
    kdb: Kysely<IndexDB>,
    from: number,
    to: number,
    chainId: number,
    txHashes: Set<Hex>
  ) {
    const startTime = Date.now();
    const txList = [...txHashes].map((tx) => Buffer.from(hexToBytes(tx)));

    // Load the Start event on chain A corresponding to the FastCCTP event on
    // home chain B.
    const fastCctpRes = await retryBackoff(
      `clogMatcher-fastCctp-logs-query-${from}-${to}`,
      () =>
        kdb
          .selectFrom("index.daimo_fast_cctp as ff")
          .innerJoin("index.daimo_fast_cctp as start", (join) =>
            join
              .onRef("start.chain_id", "=", "ff.from_chain_id")
              .onRef("start.handoff_addr", "=", "ff.handoff_addr")
              .onRef("start.nonce", "=", "ff.nonce")
              .on("start.log_name", "=", "Start")
          )
          .select([
            // Use FastFinish event for block/tx/log info
            "ff.block_hash as block_hash",
            "ff.block_num as block_num",
            "ff.tx_hash as tx_hash",
            "ff.tx_idx as tx_idx",
            "ff.log_idx as log_idx",
            // Use Start event for cross-chain token info
            "start.from_token as from_token",
            "start.from_addr as from_addr",
            "start.to_addr as to_addr",
            "start.to_amount as to_amount",
            "start.from_chain_id as from_chain_id",
          ])
          .where("ff.chain_id", "=", "" + chainId)
          .where((e) => e.between("ff.block_num", "" + from, "" + to))
          .where("ff.tx_hash", "in", txList)
          .where("ff.log_name", "=", "FastFinish")
          .execute()
    );

    for (const row of fastCctpRes) {
      const fastCctpLog = {
        blockHash: bytesToHex(assertNotNull(row.block_hash), { size: 32 }),
        blockNumber: BigInt(assertNotNull(row.block_num)),
        transactionHash: bytesToHex(assertNotNull(row.tx_hash), { size: 32 }),
        transactionIndex: Number(row.tx_idx),
        logIndex: Number(row.log_idx),
        address: bytesToAddr(assertNotNull(row.from_token)),
        from: bytesToAddr(assertNotNull(row.from_addr)),
        to: bytesToAddr(assertNotNull(row.to_addr)),
        value: BigInt(assertNotNull(row.to_amount)),
      };
      const crossChainToken = this.tokenReg.getToken(
        fastCctpLog.address,
        Number(row.from_chain_id) // cross-chain (from chain)
      );
      if (crossChainToken == null) continue;

      const crossChainTransfer: ForeignTokenTransfer = {
        ...fastCctpLog,
        foreignToken: crossChainToken,
      };
      this.txHashToTransfers.set(crossChainTransfer.transactionHash, [
        ...(this.txHashToTransfers.get(crossChainTransfer.transactionHash) ||
          []),
        crossChainTransfer,
      ]);
    }

    const elapsedMs = (Date.now() - startTime) | 0;
    console.log(
      `[MATCHER] loaded ${fastCctpRes.length} FastCCTP cross-chain events in ${elapsedMs}ms`
    );
  }

  /**
   * For a multi-log outbound transfer (e.g. SwapClog, cross-chain transfer),
   * attach the corresponding transfer info.
   */
  getCorrespondingTransfer(
    from: Address,
    to: Address,
    transactionHash: string,
    isInbound?: boolean
  ) {
    const transfers = this.txHashToTransfers.get(transactionHash);
    if (!transfers || transfers.length === 0) return null;

    // First check whether the transfer is cross-chain.
    if (daimoFastCctpAddrs.includes(to) || isInbound) {
      return transfers.find(
        (t) => t.foreignToken.chainId !== chainConfig.chainL2.id
      );
    }

    // Then check for outbound swap
    return this.getMatchingSwapTransfer(from, transfers);
  }

  /**
   * For a SwapClog, find the corresponding "to" transfer given the "from"
   * transfer (from a Daimo account to a foreign account).
   */
  getMatchingSwapTransfer(from: Address, transfers: ForeignTokenTransfer[]) {
    // Get the corresponding transfer to the given logIndex transfer.
    let curTransfer = transfers.find((t) => t.from === from);
    if (!curTransfer) return null;
    const startTransfer = curTransfer;

    const visited = new Set();
    visited.add(startTransfer.logIndex);

    // Follow the chain of transfers to find the end of the cycle.
    while (true) {
      const nextTransfer = transfers.find(
        (t) => t.from === curTransfer!.to && !visited.has(t.logIndex)
      );
      if (!nextTransfer) break;

      visited.add(nextTransfer.logIndex);
      curTransfer = nextTransfer;
    }

    // Only create a corresponding swap transfer if the endpoint transfers
    // are different coins.
    if (curTransfer.address === startTransfer.address) return null;

    console.log(
      `[MATCHER] matched ${debugJson(startTransfer)} to ${debugJson(
        curTransfer
      )}`
    );
    return curTransfer;
  }
}
