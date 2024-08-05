import { debugJson, retryBackoff } from "@daimo/common";
import { zeroAddr } from "@daimo/contract";
import { Kysely } from "kysely";
import { Address, bytesToHex, getAddress, Hex, hexToBytes } from "viem";

import { ForeignTokenTransfer } from "./foreignCoinIndexer";
import { DB as ShovelDB } from "../codegen/dbShovel";
import { TokenRegistry } from "../server/tokenRegistry";

export class SwapClogMatcher {
  /** Map of transactionHash to transfers that are within that transaction */
  private txHashToTransfers: Map<string, ForeignTokenTransfer[]> = new Map();

  /** Map of starting "to" transfer to the corresponding "from" transfer */
  private correspondingSwapTransfers: Map<
    ForeignTokenTransfer,
    ForeignTokenTransfer
  > = new Map();

  constructor(private tokenReg: TokenRegistry) {}

  // Given a set transaction hashes, load any transfers that are associated
  // with those transactions.
  async loadSwapTransfers(
    kdb: Kysely<ShovelDB>,
    from: number,
    to: number,
    chainId: number,
    transactionHashes: Hex[]
  ) {
    const startTime = Date.now();

    const txHashes = transactionHashes.map((tx) => Buffer.from(hexToBytes(tx)));

    const result = await retryBackoff(
      `swapClogMatcher-logs-query-${from}-${to}`,
      () =>
        kdb
          .selectFrom("daimo_transfers")
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
          .where("tx_hash", "in", txHashes)
          .execute()
    );

    for (const row of result) {
      const log = {
        blockHash: bytesToHex(row.block_hash, { size: 32 }),
        blockNumber: BigInt(row.block_num),
        transactionHash: bytesToHex(row.tx_hash, { size: 32 }),
        transactionIndex: row.tx_idx,
        logIndex: row.sort_idx,
        address:
          row.token == null
            ? zeroAddr
            : getAddress(bytesToHex(row.token, { size: 20 })),
        from: getAddress(bytesToHex(row.f, { size: 20 })),
        to: getAddress(bytesToHex(row.t, { size: 20 })),
        value: BigInt(row.amount),
      };
      const token = this.tokenReg.getToken(log.address, chainId, true);
      if (token == null) continue;

      const foreignTransfer: ForeignTokenTransfer = {
        ...log,
        foreignToken: token,
      };
      this.txHashToTransfers.set(foreignTransfer.transactionHash, [
        ...(this.txHashToTransfers.get(foreignTransfer.transactionHash) || []),
        foreignTransfer,
      ]);
    }

    const elapsedMs = (Date.now() - startTime) | 0;
    console.log(
      `[SWAP] loaded ${result.length} bundled transfers in ${elapsedMs}ms`
    );
  }

  // For a SwapClog, find the corresponding "to" transfer given the "from"
  // transfer (from a Daimo account to a foreign account).
  getMatchingSwapTransfer(from: Address, transactionHash: string) {
    const transfers = this.txHashToTransfers.get(transactionHash);
    if (!transfers || transfers.length === 0) return null;

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

    this.correspondingSwapTransfers.set(startTransfer, curTransfer);
    console.log(
      `[SWAP] matched ${debugJson(startTransfer)} to ${debugJson(curTransfer)}`
    );
    return curTransfer;
  }
}
