import { Pool } from "pg";
import { bytesToHex, getAddress } from "viem";

import { ForeignTokenTransfer } from "./foreignCoinIndexer";
import { TokenRegistry } from "../server/tokenRegistry";
import { retryBackoff } from "../utils/retryBackoff";

export class SwapIndexer {
  /** Map of transactionHash to transfers that are within that transaction */
  private txHashToTransfers: Map<string, ForeignTokenTransfer[]> = new Map();

  constructor(private tokenReg: TokenRegistry) {}

  // Given a userOp, load any transfers that are within the userOp.
  async loadSwapTransfers(
    pg: Pool,
    from: number,
    to: number,
    chainId: number,
    transactionHashes: string[]
  ) {
    const startTime = Date.now();
    const result = await retryBackoff(
      `swapIndexer-logs-query-${from}-${to}`,
      () =>
        pg.query(
          `
          select
            chain_id,
            block_num,
            block_hash,
            tx_hash,
            tx_idx,
            log_addr,
            f as "from",
            t as "to",
            v as "value"
          from erc20_transfers
          where (
            block_num >= $1
            and block_num <= $2
            and chain_id = $3
            and tx_hash in ($4)
          );
        `,
          [from, to, chainId, (transactionHashes as any).join(",")]
        )
    );

    for (const row of result.rows) {
      const token = this.tokenReg.getToken(row.address);
      if (token == null) continue;
      const log: ForeignTokenTransfer = {
        blockHash: bytesToHex(row.block_hash, { size: 32 }),
        blockNumber: BigInt(row.block_num),
        transactionHash: bytesToHex(row.tx_hash, { size: 32 }),
        transactionIndex: row.tx_idx,
        logIndex: row.log_idx,
        address: getAddress(bytesToHex(row.log_addr, { size: 20 })),
        from: getAddress(bytesToHex(row.f, { size: 20 })),
        to: getAddress(bytesToHex(row.t, { size: 20 })),
        value: BigInt(row.v),
        foreignToken: token,
      };
      this.txHashToTransfers.set(log.transactionHash, [
        ...(this.txHashToTransfers.get(log.transactionHash) || []),
        log,
      ]);
    }
    console.log(
      `[SWAP] loaded ${result.rows.length} bundled transfers in ${
        Date.now() - startTime
      }ms`
    );
  }

  // For a SwapClog, find the corresponding "to" transfer given the "from"
  // transfer (from a Daimo account to a foreign account).
  getForeignTokenSendForSwap(
    transactionHash: string,
    logIndex: number
  ): ForeignTokenTransfer | null {
    const transfers = this.txHashToTransfers.get(transactionHash);
    if (!transfers || transfers.length === 0) return null;

    // Get the corresponding transfer to the given logIndex transfer.
    let currentTransfer = transfers.find((t) => t.logIndex === logIndex);
    if (!currentTransfer) return null;

    const visited = new Set();
    visited.add(currentTransfer.logIndex);

    // Follow the chain of transfers to find the end of the cycle.
    while (true) {
      if (visited.size === transfers.length) return null;

      const nextTransfer = transfers.find(
        (t) => t.from === currentTransfer!.to && !visited.has(t.logIndex)
      );

      if (!nextTransfer) return currentTransfer;

      visited.add(nextTransfer.logIndex);
      currentTransfer = nextTransfer;
    }
  }
}
