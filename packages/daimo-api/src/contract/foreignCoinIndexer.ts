import {
  BigIntStr,
  EAccount,
  ProposedSwap,
  SwapQueryResult,
  daimoUSDC,
  isAmountDust,
} from "@daimo/common";
import { Pool } from "pg";
import { Address, Hex, bytesToHex, getAddress } from "viem";

import { Transfer } from "./homeCoinIndexer";
import { Indexer } from "./indexer";
import { NameRegistry } from "./nameRegistry";
import { getSwapQuote } from "../api/getSwapRoute";
import { chainConfig } from "../env";
import { UniswapClient } from "../network/uniswapClient";
import { ViemClient } from "../network/viemClient";
import { ForeignToken, fetchForeignTokenList } from "../server/coinList";
import { addrTxHashKey } from "../utils/indexing";
import { retryBackoff } from "../utils/retryBackoff";

// An in/outbound swap coin transfer with swap coin metadata.
export type ForeignTokenTransfer = Transfer & {
  foreignToken: ForeignToken;
};

/* Tracks non-USDC coin transfers.
 * The lifecycle of a foreign coin is a bit complex:
 * - An external user sends a foreign token to Daimo address.
 * - Daimo address treats the inbound transfer as a "pending swap".
 * - Daimo address sends a "swap" transaction to Uniswap / DEX, generating a
 *   outbound swap transfer log.
 * - The DEX generates an inbound transfer of Home coin to Daimo address.
 * - Foreign Coin Indexer helps map the final inbound Home coin transfer to the
 *   original inbound foreign token transfer.
 */
export class ForeignCoinIndexer extends Indexer {
  private foreignTokens: Map<Address, ForeignToken> = new Map();
  private allTransfers: ForeignTokenTransfer[] = [];

  private pendingSwapsByAddr: Map<Address, ForeignTokenTransfer[]> = new Map(); // inbound transfers without a corresponding outbound swap
  private sendsByAddrTxHash: Map<string, ForeignTokenTransfer> = new Map(); // outbound transfers
  private correspondingReceiveOfSend: Map<string, ForeignTokenTransfer> =
    new Map(); // inbound foreign token transfer corresponding the outbound swap send.

  private listeners: ((transfers: ForeignTokenTransfer[]) => void)[] = [];

  constructor(private nameReg: NameRegistry, public uc: UniswapClient) {
    super("SWAPCOIN");
  }

  async load(pg: Pool, from: number, to: number) {
    const startTime = Date.now();

    if (this.foreignTokens.size === 0) {
      this.foreignTokens = await fetchForeignTokenList();
    }

    const result = await retryBackoff(
      `swapCoinIndexer-logs-query-${from}-${to}`,
      async () => {
        await pg.query(`REFRESH MATERIALIZED VIEW filtered_erc20_transfers;`);
        return await pg.query(
          `SELECT * from filtered_erc20_transfers 
          WHERE block_num BETWEEN $1 AND $2
          ORDER BY block_num ASC, log_idx ASC;`,
          [from, to]
        );
      }
    );

    if (this.updateLastProcessedCheckStale(from, to)) return;

    const logs: ForeignTokenTransfer[] = result.rows
      .map((row) => {
        return {
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
      })
      .filter((t) => this.foreignTokens.has(t.address))
      .map((t) => ({
        ...t,
        foreignToken: this.foreignTokens.get(t.address)!,
      }));
    console.log(
      `[SWAPCOIN] loaded ${logs.length} transfers ${from} ${to} in ${
        Date.now() - startTime
      }ms`
    );

    if (logs.length === 0) return;

    await this.processSwapCoinLogs(logs);
  }

  async processSwapCoinLogs(logs: ForeignTokenTransfer[]) {
    for (const log of logs) {
      this.processSwapCoinDelta(getAddress(log.to), log.value, log);
      this.processSwapCoinDelta(getAddress(log.from), -log.value, log);
    }

    this.allTransfers = this.allTransfers.concat(logs);
    this.listeners.forEach((l) => l(logs));
  }

  processSwapCoinDelta(
    addr: Address,
    delta: bigint,
    log: ForeignTokenTransfer
  ) {
    if (delta < 0n) {
      // outbound transfer
      this.sendsByAddrTxHash.set(addrTxHashKey(addr, log.transactionHash), log);

      const pendingSwaps = this.pendingSwapsByAddr.get(addr) || [];

      // Delete the first matching pending swap that is now swapped
      const matchingPendingSwap = pendingSwaps.find(
        (t) =>
          t.foreignToken.token === log.foreignToken.token && t.value === -delta
      );

      if (matchingPendingSwap == null) {
        console.log(
          `[SWAPCOIN] SKIPPING outbound token transfer, no matching inbound found. from ${addr}, ${log.value} ${log.foreignToken.symbol} ${log.foreignToken.token}`
        );
        return;
      }

      this.correspondingReceiveOfSend.set(
        addrTxHashKey(addr, log.transactionHash),
        matchingPendingSwap
      );

      const newPendingSwaps = pendingSwaps.filter(
        (t) => t.transactionHash !== matchingPendingSwap.transactionHash
      );

      this.pendingSwapsByAddr.set(addr, newPendingSwaps);
    } else {
      // inbound transfer, add as a pending swap
      const pending = this.pendingSwapsByAddr.get(addr);
      if (pending != null) {
        pending.push(log);
      } else {
        this.pendingSwapsByAddr.set(addr, [log]);
      }
    }
  }

  /** Listener invoked for all past ETH transfers, then for new ones. */
  pipeAllTransfers(listener: (logs: ForeignTokenTransfer[]) => void) {
    listener(this.allTransfers);
    this.addListener(listener);
  }

  /** Listener is invoked for all new ETH transfers. */
  addListener(listener: (logs: ForeignTokenTransfer[]) => void) {
    this.listeners.push(listener);
  }

  /** Unsubscribe from new ETH transfers. */
  removeListener(listener: (logs: ForeignTokenTransfer[]) => void) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  async getProposedSwapForLog(
    log: ForeignTokenTransfer,
    vc?: ViemClient
  ): Promise<ProposedSwap | null> {
    const swap = await retryBackoff(`getProposedSwapForLog`, async () => {
      const fromAcc = await this.nameReg.getEAccount(log.from);

      if (vc) {
        return this.getProposedSwap(
          log.foreignToken.token,
          log.value.toString() as `${bigint}`,
          fromAcc,
          daimoUSDC.token as Address, // USDC
          log.to,
          vc
        );
      }
      return this.getProposedSwapSlow(
        log.value.toString() as `${bigint}`,
        log.foreignToken.token,
        fromAcc.addr
      );
    });

    console.log(
      `[SWAPCOIN] getProposedSwapForLog ${log.from}: ${JSON.stringify(swap)}`
    );

    if (!swap) return null;
    if (!swap.routeFound) return null;
    if (isAmountDust(swap.toAmount, log.foreignToken)) return null;
    return swap;
  }

  async getProposedSwapsForAddr(
    addr: Address,
    vc: ViemClient
  ): Promise<ProposedSwap[]> {
    const pendingSwaps = this.pendingSwapsByAddr.get(addr) || [];
    const swaps = (
      await Promise.all(
        pendingSwaps.map((swap) => this.getProposedSwapForLog(swap, vc))
      )
    ).filter((s): s is ProposedSwap => s != null);

    return swaps;
  }

  // Used to detect onchain swaps initiated by the user.
  // Assumes that one transaction only contains one swap per address.
  // This won't be true if for example a 4337 bundle contains multiple swaps
  // from the same user, or the user swaps multiple assets in a single tx.
  getForeignTokenReceiveForSwap(
    addr: Address,
    txHash: Hex
  ): ForeignTokenTransfer | null {
    const log = this.sendsByAddrTxHash.get(addrTxHashKey(addr, txHash));
    if (log == null) return null;

    const correspondingReceive = this.correspondingReceiveOfSend.get(
      addrTxHashKey(addr, txHash)
    )!;

    return {
      ...correspondingReceive,
      foreignToken: this.foreignTokens.get(log.foreignToken.token)!,
    };
  }

  // Fetch a route using on-chain oracle.
  public async getProposedSwap(
    fromToken: Address,
    fromAmount: BigIntStr,
    fromAcc: EAccount,
    toToken: Address,
    toAddr: Address,
    vc: ViemClient
  ): Promise<SwapQueryResult | null> {
    if (fromToken === toToken) return null;
    const chainId = chainConfig.daimoChain === "base" ? 8453 : 84532;

    const swap = await retryBackoff(`getProposedBackoff`, async () => {
      return await getSwapQuote({
        amountInStr: fromAmount,
        tokenIn: fromToken,
        tokenOut: toToken,
        fromAccount: fromAcc,
        toAddr,
        chainId,
        vc,
      });
    });
    return swap;
  }

  // For debugging / introspection of Uniswap routes
  public async getProposedSwapSlow(
    fromAmount: BigIntStr,
    fromToken: Address,
    toAddr: Address
  ) {
    const coin = this.foreignTokens.get(fromToken);
    if (coin == null) return null;
    return this.uc.getProposedSwap(
      toAddr,
      fromAmount,
      coin,
      0,
      {
        addr: getAddress("0xdeaddeaddeaddeaddeaddeaddeaddeaddeaddead"),
      },
      true
    );
  }
}
