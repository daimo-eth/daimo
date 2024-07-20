import { Pool } from "pg";
import { Address, bytesToHex, getAddress } from "viem";

import { ForeignTokenTransfer } from "./foreignCoinIndexer";
import { TokenRegistry } from "../server/tokenRegistry";
import { retryBackoff } from "../utils/retryBackoff";

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
    pg: Pool,
    from: number,
    to: number,
    chainId: number,
    transactionHashes: string[]
  ) {
    const startTime = Date.now();

    const txHashes = transactionHashes.map((tx) => `\\x${tx.substring(2)}`);

    const result = await retryBackoff(
      `swapClogMatcher-logs-query-${from}-${to}`,
      async () => {
        return pg.query(
          `SELECT * from erc20_transfers WHERE 
          tx_hash = ANY($1::bytea[]);`,
          [txHashes]
        );
      }
    );

    for (const row of result.rows) {
      const log = {
        blockHash: bytesToHex(row.block_hash, { size: 32 }),
        blockNumber: BigInt(row.block_num),
        transactionHash: bytesToHex(row.tx_hash, { size: 32 }),
        transactionIndex: row.tx_idx,
        logIndex: row.log_idx,
        address: getAddress(bytesToHex(row.log_addr, { size: 20 })),
        from: getAddress(bytesToHex(row.f, { size: 20 })),
        to: getAddress(bytesToHex(row.t, { size: 20 })),
        value: BigInt(row.v),
      };
      const token = this.tokenReg.getToken(log.address, chainId, true); // include home coin
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
      `[SWAP] loaded ${result.rows.length} bundled transfers in ${elapsedMs}ms`
    );
  }

  // For a SwapClog, find the corresponding "to" transfer given the "from"
  // transfer (from a Daimo account to a foreign account).
  getMatchingSwapTransfer(from: Address, transactionHash: string) {
    const transfers = this.txHashToTransfers.get(transactionHash);
    if (!transfers || transfers.length === 0) return null;

    // Get the corresponding transfer to the given logIndex transfer.
    let currentTransfer = transfers.find((t) => t.from === from);
    if (!currentTransfer) return null;
    const startTransfer = currentTransfer;

    const visited = new Set();
    visited.add(startTransfer.logIndex);

    // Follow the chain of transfers to find the end of the cycle.
    while (true) {
      const nextTransfer = transfers.find(
        (t) => t.from === currentTransfer!.to && !visited.has(t.logIndex)
      );

      if (!nextTransfer) break;

      visited.add(nextTransfer.logIndex);
      currentTransfer = nextTransfer;
    }

    // Only create a corresponding swap transfer if the endpoint transfers
    // are different coins.
    if (currentTransfer.address === startTransfer.address) return null;

    this.correspondingSwapTransfers.set(startTransfer, currentTransfer);
    console.log(
      `[SWAP] matched ${JSON.stringify(startTransfer)} to ${JSON.stringify(
        currentTransfer
      )}`
    );
    return currentTransfer;
  }
}
