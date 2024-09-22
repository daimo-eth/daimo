import {
  amountToDollars,
  assertNotNull,
  BigIntStr,
  bytesToAddr,
  debugJson,
  EAccount,
  guessTimestampFromNum,
  ProposedSwap,
  retryBackoff,
  SwapQueryResult,
} from "@daimo/common";
import {
  baseDAI,
  baseUSDbC,
  baseUSDC,
  baseWETH,
  ForeignToken,
} from "@daimo/contract";
import { Kysely } from "kysely";
import { Address, bytesToHex, getAddress, Hex, zeroAddress } from "viem";

import { Transfer } from "./homeCoinIndexer";
import { Indexer } from "./indexer";
import { NameRegistry } from "./nameRegistry";
import { getSwapQuote } from "../api/getSwapRoute";
import { DB as IndexDB } from "../codegen/dbIndex";
import { chainConfig } from "../env";
import { ViemClient } from "../network/viemClient";
import { TokenRegistry } from "../server/tokenRegistry";
import { addrTxHashKey } from "../utils/indexing";

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
  private allTransfers: ForeignTokenTransfer[] = [];

  private pendingSwapsByAddr: Map<Address, ForeignTokenTransfer[]> = new Map(); // inbound transfers without a corresponding outbound swap
  private sendsByAddrTxHash: Map<string, ForeignTokenTransfer> = new Map(); // outbound transfers
  private correspondingReceiveOfSend: Map<string, ForeignTokenTransfer> =
    new Map(); // inbound foreign token transfer corresponding the outbound swap send.

  private inboxBalance: Map<string, bigint> = new Map(); // map `${addr}-${token}` to balance

  private listeners: ((transfers: ForeignTokenTransfer[]) => void)[] = [];

  constructor(
    private nameReg: NameRegistry,
    private vc: ViemClient,
    private tokenReg: TokenRegistry
  ) {
    super("FOREIGN-COIN");
  }

  async load(kdb: Kysely<IndexDB>, from: number, to: number) {
    const startMs = performance.now();

    const result = await retryBackoff(
      `foreignCoinIndexer-logs-query-${from}-${to}`,
      async () =>
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
          .where("chain_id", "=", "" + chainConfig.chainL2.id)
          .where((eb) => eb.between("block_num", "" + from, "" + to))
          .orderBy("block_num")
          .orderBy("sort_idx")
          .execute()
    );

    if (this.updateLastProcessedCheckStale(from, to)) return;

    const logs: ForeignTokenTransfer[] = result
      .map((row) => ({
        blockHash: bytesToHex(row.block_hash, { size: 32 }),
        blockNumber: BigInt(row.block_num),
        transactionHash: bytesToHex(row.tx_hash, { size: 32 }),
        transactionIndex: Number(row.tx_idx),
        // Mislabelled for backwards compatibility. We need to support both
        // ERC-20 and native token transfers; the latter have no log index.
        logIndex: Number(row.sort_idx),
        address:
          row.token == null
            ? zeroAddress // ETH / native token transfer
            : bytesToAddr(row.token), // ERC-20
        from: bytesToAddr(row.f),
        to: bytesToAddr(row.t),
        value: BigInt(row.amount),
      }))
      .filter((t) => t.address !== chainConfig.tokenAddress) // not home coin
      .filter((t) => this.tokenReg.hasToken(t.address)) // no spam tokens
      .map((t) => ({
        ...t,
        foreignToken: this.tokenReg.getToken(t.address)!,
      }));

    const elapsedMs = (performance.now() - startMs) | 0;
    console.log(
      `[FOREIGN-COIN] loaded ${logs.length} transfers ${from} ${to} in ${elapsedMs}ms`
    );

    if (logs.length === 0) return;

    await this.processForeignCoinLogs(logs);
  }

  async processForeignCoinLogs(logs: ForeignTokenTransfer[]) {
    for (const log of logs) {
      this.processForeignCoinDelta(getAddress(log.to), log.value, log);
      this.processForeignCoinDelta(getAddress(log.from), -log.value, log);
    }

    this.allTransfers = this.allTransfers.concat(logs);
    this.listeners.forEach((l) => l(logs));
  }

  processForeignCoinDelta(
    addr: Address,
    delta: bigint,
    log: ForeignTokenTransfer
  ) {
    // Skip if addr is not a daimo account
    const addrName = this.nameReg.resolveDaimoNameForAddr(addr);
    if (addrName == null) return;

    // Track balance
    const key = `${addr}-${log.foreignToken.token}`;
    const balance = this.inboxBalance.get(key) || 0n;
    let newBal = balance + delta;
    if (newBal < 0) {
      console.warn(
        `[FOREIGN-COIN] NEG BAL ${key} ${newBal} after ${debugJson(log)}`
      );
      newBal = 0n;
    }
    this.inboxBalance.set(key, newBal);

    if (delta < 0n) {
      // outbound transfer
      console.log(
        `[FOREIGN-COIN] outbound token transfer from ${addrName} ${addr}, ${log.value} ${log.foreignToken.symbol} ${log.foreignToken.token}`
      );
      this.sendsByAddrTxHash.set(addrTxHashKey(addr, log.transactionHash), log);

      // Delete the first matching pending swap that is now swapped
      const pendingSwaps = this.pendingSwapsByAddr.get(addr) || [];
      const matchingPendingSwap = pendingSwaps.find(
        (t) =>
          t.foreignToken.token === log.foreignToken.token && t.value === -delta
      );

      // Special case: we previously swapped ETH in bulk
      // If there's an unmatched outbound, replace all prior inbounds with a single one for the full balance.
      if (matchingPendingSwap == null) {
        const balance = this.inboxBalance.get(key) || 0n;
        console.log(
          `[FOREIGN-COIN] UNMATCHED outbound token transfer from ${addrName} ${addr}, ${log.value} ${log.foreignToken.symbol} ${log.foreignToken.token}, remaining balance ${balance}`
        );
        const replacementSwap = [];
        if (balance > 0n) {
          replacementSwap.push({
            ...log,
            address: addr,
            from: addr,
            to: addr,
            value: balance,
          });
        }
        this.pendingSwapsByAddr.set(addr, replacementSwap);
        return;
      }

      // Record matching inbound (receive) > outbound (swap to home coin)
      this.correspondingReceiveOfSend.set(
        addrTxHashKey(addr, log.transactionHash),
        matchingPendingSwap
      );

      // Clear specific pending swap
      const newPendingSwaps = pendingSwaps.filter(
        (t) => t.transactionHash !== matchingPendingSwap.transactionHash
      );
      this.pendingSwapsByAddr.set(addr, newPendingSwaps);
    } else {
      // inbound transfer, add as a pending swap
      const pending = this.pendingSwapsByAddr.get(addr) || [];
      pending.push(log);
      this.pendingSwapsByAddr.set(addr, pending);
      console.log(
        `[FOREIGN-COIN] inbound token transfer to ${addrName} ${addr}, ${log.value} ${log.foreignToken.symbol} ${log.foreignToken.token}, new bal ${newBal}, # swaps pending: ${pending.length}`
      );
    }
  }

  /** Listener invoked for all past foreignCoin transfers, then for new ones. */
  pipeAllTransfers(listener: (logs: ForeignTokenTransfer[]) => void) {
    listener(this.allTransfers);
    this.addListener(listener);
  }

  /** Listener is invoked for all new foreignCoin transfers. */
  addListener(listener: (logs: ForeignTokenTransfer[]) => void) {
    this.listeners.push(listener);
  }

  /** Unsubscribe from new foreignCoin transfers. */
  removeListener(listener: (logs: ForeignTokenTransfer[]) => void) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  async getProposedSwapForLog(
    log: ForeignTokenTransfer
  ): Promise<ProposedSwap | null> {
    const swap = await retryBackoff(`getProposedSwapForLog`, async () => {
      const fromAcc = await this.nameReg.getEAccount(log.from);

      // TODO: retrieve correct home coin address
      const homeCoin = baseUSDC;
      const receivedAt = guessTimestampFromNum(
        log.blockNumber,
        chainConfig.daimoChain
      );

      return this.getProposedSwap(
        receivedAt,
        log.foreignToken.token,
        log.value.toString() as `${bigint}`,
        fromAcc,
        homeCoin.token,
        log.to
      );
    });

    console.log(
      `[FOREIGN-COIN] getProposedSwapForLog ${log.from}: ${debugJson(swap)}`
    );

    if (!swap) return null;
    if (!swap.routeFound) return null;
    if (isAmountDust(swap.toAmount, log.foreignToken)) return null;
    return swap;
  }

  async getProposedSwapsForAddr(addr: Address): Promise<ProposedSwap[]> {
    const pendingSwaps = this.pendingSwapsByAddr.get(addr) || [];
    const swaps = (
      await Promise.all(
        pendingSwaps.map((swap) => this.getProposedSwapForLog(swap))
      )
    ).filter((s): s is ProposedSwap => s != null);
    console.log(
      `[FOREIGN-COIN] getProposedSwaps ${addr}: ${pendingSwaps.length} pending, ${swaps.length} proposedSwaps`
    );

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
    );
    if (correspondingReceive == null) return null;

    return {
      ...correspondingReceive,
      foreignToken: assertNotNull(
        this.tokenReg.getToken(log.foreignToken.token)
      ),
    };
  }

  // Fetch a route using on-chain oracle.
  public async getProposedSwap(
    receivedAt: number,
    fromToken: Address,
    fromAmount: BigIntStr,
    fromAcc: EAccount,
    toToken: Address,
    toAddr: Address
  ): Promise<SwapQueryResult | null> {
    if (fromToken === toToken) return null;
    const chainId = chainConfig.chainL2.id;

    return await getSwapQuote({
      receivedAt,
      amountInStr: fromAmount,
      tokenIn: fromToken,
      tokenOut: toToken,
      fromAccount: fromAcc,
      toAddr,
      chainId,
      vc: this.vc,
      tokenReg: this.tokenReg,
    });
  }
}

const NON_DUST_TOKEN_WHITELIST = new Set([
  zeroAddress, // native ETH
  baseWETH.token,
  baseUSDC.token,
  baseUSDbC.token,
  baseDAI.token,
]);

// It's dust if the amount is less than $1 and the token is not on the whitelist.
function isAmountDust(usdcAmount: number | bigint, fromCoin: ForeignToken) {
  if (NON_DUST_TOKEN_WHITELIST.has(fromCoin.token)) return false;

  if (Number(amountToDollars(usdcAmount)) >= 1) return false;

  return true;
}
