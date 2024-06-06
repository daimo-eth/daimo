import {
  AddrLabel,
  BigIntStr,
  ProposedSwap,
  guessTimestampFromNum,
  nativeETH,
} from "@daimo/common";
import {
  daimoOffchainUtilsABI,
  daimoOffchainUtilsAddress,
} from "@daimo/contract";
import { Pool } from "pg";
import { Address } from "viem";

import { Indexer } from "./indexer";
import { NameRegistry } from "./nameRegistry";
import { chainConfig } from "../env";
import { UniswapClient } from "../network/uniswapClient";
import { ViemClient } from "../network/viemClient";
import { chunks } from "../utils/func";
import { retryBackoff } from "../utils/retryBackoff";

export type ETHTransfer = {
  to: Address;
  value: bigint;
  blockNumber: number;
};

/* Tracks ETH transfers. */
export class ETHIndexer extends Indexer {
  // Map of all addresses to their latest balance and block number for that balance.
  private latestBalances: Map<Address, [bigint, number]> = new Map();
  private allETHTransfers: ETHTransfer[] = [];

  private listeners: ((ethTransfers: ETHTransfer[]) => void)[] = [];

  constructor(
    private vc: ViemClient,
    private uc: UniswapClient,
    private nameReg: NameRegistry
  ) {
    super("ETH");
  }

  // Fetch balances for all addresses at block number.
  batchGetETHBalances = async (addrs: Address[], blockNum: number) => {
    if (blockNum < chainConfig.offChainUtilsDeployBlock) {
      return new Array(addrs.length).fill(0n) as bigint[];
    } else {
      return await this.vc.publicClient.readContract({
        abi: daimoOffchainUtilsABI,
        address: daimoOffchainUtilsAddress,
        functionName: "batchGetETHBalances",
        args: [addrs],
        blockNumber: BigInt(blockNum),
      });
    }
  };

  async batchFetchBalances(
    allAddrs: Address[],
    toBlockNum: number
  ): Promise<Map<Address, bigint>> {
    // Call contract to get ETH balances for all addresses at block number.
    const balanceDiffs = new Map<Address, bigint>();

    // Query all balances for all addresses at the current block number.
    const batchedQueryAddrs = [...chunks(allAddrs, 100)];
    for (const batch of batchedQueryAddrs) {
      if (batch.length === 0) continue;
      const newBalances = await retryBackoff(`batchGetETHBalances`, () =>
        this.batchGetETHBalances(batch, toBlockNum)
      );

      // Calculate difference between fetched balance and latest cached balance.
      for (let i = 0; i < batch.length; i++) {
        const oldBalance = this.latestBalances.has(batch[i])
          ? this.latestBalances.get(batch[i])![0]
          : 0n;
        const balanceDiff = newBalances[i] - oldBalance;

        // If received more ETH, add to balance diffs.
        if (balanceDiff > 0n) {
          balanceDiffs.set(batch[i], balanceDiff);
        }

        // Update cache with new balance and currentblock number.
        this.latestBalances.set(batch[i], [newBalances[i], toBlockNum]);
      }
    }
    return balanceDiffs;
  }

  // TODO: For now, ETH transfers are just batched balance changes between
  // (from, to] since Shovel doesn't support indexing them.
  async load(_: Pool, from: number, to: number) {
    const startTime = Date.now();
    const allAddrs = this.nameReg.getAllDAccounts().map((a) => a.addr);

    // Query differences in latest balances and starting balances for all accounts
    const balanceDiffs = await this.batchFetchBalances(allAddrs, to);

    const ms = Date.now() - startTime;
    console.log(
      `[ETH] loaded ${balanceDiffs.size} ETH transfers ${from} ${to} in ${ms}ms`
    );

    if (this.updateLastProcessedCheckStale(from, to)) return;

    const newTransfers: ETHTransfer[] = Array.from(
      balanceDiffs,
      ([addr, diff]) => ({
        to: addr,
        value: diff,
        blockNumber: to,
      })
    );

    this.listeners.forEach((l) => l(newTransfers));
  }

  /** Listener invoked for all past ETH transfers, then for new ones. */
  pipeAllTransfers(listener: (logs: ETHTransfer[]) => void) {
    listener(this.allETHTransfers);
    this.addListener(listener);
  }

  /** Listener is invoked for all new ETH transfers. */
  addListener(listener: (logs: ETHTransfer[]) => void) {
    this.listeners.push(listener);
  }

  /** Unsubscribe from new ETH transfers. */
  removeListener(listener: (logs: ETHTransfer[]) => void) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  async getProposedSwapsForAddr(
    addr: Address,
    runInBackground?: boolean
  ): Promise<ProposedSwap[]> {
    const [latestBalance, latestBlock] = this.latestBalances.get(addr) || [
      0n,
      0,
    ];

    if (latestBalance === 0n) return []; // todo: ignore dust?

    const swap = await this.uc.getProposedSwap(
      addr,
      latestBalance.toString() as BigIntStr,
      nativeETH,
      guessTimestampFromNum(latestBlock, chainConfig.daimoChain),
      {
        addr: chainConfig.uniswapETHPoolAddress,
        label: AddrLabel.UniswapETHPool,
      },
      runInBackground
    );

    console.log(`[ETH] getProposedSwap ${addr}: ${JSON.stringify(swap)}`);

    return swap && swap.routeFound ? [swap] : [];
  }
}
