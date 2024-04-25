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
import { Address } from "viem";

import { NameRegistry } from "./nameRegistry";
import { chainConfig } from "../env";
import { UniswapClient } from "../network/uniswapClient";
import { ViemClient } from "../network/viemClient";
import { Watcher } from "../shovel/watcher";
import { chunks } from "../utils/func";
import { addrBlockNumKey } from "../utils/indexing";
import { retryBackoff } from "../utils/retryBackoff";

export type ETHTransfer = {
  to: Address;
  value: bigint;
  blockNumber: number;
};

export const uniswapETHPoolAddr = "0xd0b53D9277642d899DF5C87A3966A349A798F224";

/* Tracks ETH transfers. */
export class ETHIndexer {
  private cachedBalances: Map<string, bigint> = new Map();
  private latestBalance: Map<Address, [bigint, number]> = new Map();
  private allETHTransfers: ETHTransfer[] = [];

  private latest = 5699999;
  private isIndexing = false;

  private listeners: ((ethTransfers: ETHTransfer[]) => void)[] = [];

  constructor(
    private vc: ViemClient,
    private uc: UniswapClient,
    private nameReg: NameRegistry
  ) {}

  // Watches shovel for new blocks, and indexes ETH transfers from them.
  // For now, ETH transfers are just batched balance changes since
  // Shovel doesn't support them.
  async watch(shovel: Watcher) {
    setInterval(async () => {
      try {
        if (this.isIndexing) {
          console.log(`[ETHINDEXER] skipping tick, already indexing`);
          return;
        }
        this.isIndexing = true;

        const shovelLatest = await shovel.getShovelLatest();

        // localLatest <= 0 when there are no new blocks in shovel
        // or, for whatever reason, we are ahead of shovel.
        if (shovelLatest > this.latest) {
          await this.load(this.latest + 1, shovelLatest);
          this.latest = shovelLatest;
        }
      } finally {
        this.isIndexing = false;
      }
    }, 1000);
  }

  async batchFetchAndCacheBalances(allAddrs: Address[], blockNum: number) {
    const batchedAddrs = [...chunks(allAddrs, 1000)];

    for (const batch of batchedAddrs) {
      console.log(`[ETH] fetching ${batch.length} balances at ${blockNum}`);

      const balances = await (async () => {
        if (blockNum < chainConfig.offChainUtilsDeployBlock) {
          return [...Array(batch.length).keys()].map((_) => 0n);
        } else {
          return await retryBackoff(`batchGetETHBalances`, () =>
            this.vc.publicClient.readContract({
              abi: daimoOffchainUtilsABI,
              address: daimoOffchainUtilsAddress,
              functionName: "batchGetETHBalances",
              args: [batch],
              blockNumber: BigInt(blockNum),
            })
          );
        }
      })();

      for (const [i, balance] of balances.entries()) {
        this.cachedBalances.set(addrBlockNumKey(batch[i], blockNum), balance);
      }
    }
  }

  async load(from: number, to: number) {
    const startTime = Date.now();

    // TODO: For now, ETH transfers are just batched balance changes between
    // (from, to] since Shovel doesn't support indexing them.

    const allAddrs = this.nameReg.getAllDAccounts().map((a) => a.addr);

    // Query latest balances and starting balances for all accounts
    await Promise.all([
      this.batchFetchAndCacheBalances(allAddrs, to),
      this.batchFetchAndCacheBalances(allAddrs, from - 1),
    ]);

    const newTransfers = allAddrs
      .map((addr) => {
        const balanceAfter = this.cachedBalances.get(
          addrBlockNumKey(addr, to)
        )!;
        const balanceBefore = this.cachedBalances.get(
          addrBlockNumKey(addr, from - 1)
        )!;

        const currentLatestBalance = this.latestBalance.get(addr);
        if (!currentLatestBalance || currentLatestBalance[0] !== balanceAfter) {
          this.latestBalance.set(addr, [balanceAfter, to]);
        }

        if (balanceBefore >= balanceAfter) return null;

        return {
          to: addr,
          value: balanceAfter - balanceBefore,
          blockNumber: to,
        } as ETHTransfer;
      })
      .filter((t): t is ETHTransfer => t != null);

    console.log(
      `[ETH] loaded ${newTransfers.length} ETH transfers ${from} ${to} in ${
        Date.now() - startTime
      }ms`
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

  async getProposedSwapsForAddr(addr: Address): Promise<ProposedSwap[]> {
    const [latestBalance, latestBlock] = this.latestBalance.get(addr) || [
      0n,
      0,
    ];

    console.log(
      `[ETH] getProposedSwap ${addr}: ${latestBalance} at ${latestBlock}`
    );

    if (!latestBalance) return []; // todo: ignore dust?

    const swap = await this.uc.getProposedSwap(
      addr,
      latestBalance.toString() as BigIntStr,
      nativeETH,
      guessTimestampFromNum(latestBlock, chainConfig.daimoChain),
      { addr: uniswapETHPoolAddr, label: AddrLabel.UniswapETHPool }
    );

    console.log(`[ETH] getProposedSwap ${addr}: ${JSON.stringify(swap)}`);

    return swap ? [swap] : [];
  }
}
