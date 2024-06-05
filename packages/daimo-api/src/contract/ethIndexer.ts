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
import { addrBlockNumKey } from "../utils/indexing";
import { retryBackoff } from "../utils/retryBackoff";

export type ETHTransfer = {
  to: Address;
  value: bigint;
  blockNumber: number;
};

/* Tracks ETH transfers. */
export class ETHIndexer extends Indexer {
  private cachedBalances = new Map<string, bigint>();
  private latestBalance: Map<Address, [bigint, number]> = new Map();
  private allETHTransfers: ETHTransfer[] = [];

  private listeners: ((ethTransfers: ETHTransfer[]) => void)[] = [];

  constructor(
    private vc: ViemClient,
    private uc: UniswapClient,
    private nameReg: NameRegistry
  ) {
    super("ETH");
  }

  async batchFetchBalances(
    allAddrs: Address[],
    blockNum: number,
    cache: boolean // whether to store query results in cache or not, clears existing cache entries as well if not
  ): Promise<Map<Address, bigint> | undefined> {
    const batchGetETHBalances = async (addrs: Address[]) => {
      if (blockNum < chainConfig.offChainUtilsDeployBlock) {
        return new Array(addrs.length).fill(0n) as bigint[];
      } else {
        try {
          const ethBalances = await this.vc.publicClient.readContract({
            abi: daimoOffchainUtilsABI,
            address: daimoOffchainUtilsAddress,
            functionName: "batchGetETHBalances",
            args: [addrs],
            blockNumber: BigInt(blockNum),
          });
          return ethBalances;
        } catch (e) {
          console.log(`[ETH INDEXER] batchGetETHBalances error: ${e}`);
        }
      }
    };

    const ret = new Map<Address, bigint>();

    const queryAddrs = [] as Address[];
    for (const addr of allAddrs) {
      if (this.cachedBalances.has(addrBlockNumKey(addr, blockNum))) {
        ret.set(
          addr,
          this.cachedBalances.get(addrBlockNumKey(addr, blockNum))!
        );
        if (!cache) {
          this.cachedBalances.delete(addrBlockNumKey(addr, blockNum));
        }
      } else queryAddrs.push(addr);
    }

    const batchedQueryAddrs = [...chunks(queryAddrs, 100)];

    for (const batch of batchedQueryAddrs) {
      if (batch.length === 0) continue;
      const balances = await retryBackoff(`batchGetETHBalances`, () =>
        batchGetETHBalances(batch)
      );
      if (!balances) return undefined;

      for (let i = 0; i < batch.length; i++) {
        ret.set(batch[i], balances[i]);
        if (cache) {
          this.cachedBalances.set(
            addrBlockNumKey(batch[i], blockNum),
            balances[i]
          );
        }
      }
    }

    return ret;
  }

  async load(_: Pool, from: number, to: number) {
    const startTime = Date.now();
    // TODO: For now, ETH transfers are just batched balance changes between
    // (from, to] since Shovel doesn't support indexing them.

    const allAddrs = this.nameReg.getAllDAccounts().map((a) => a.addr);

    // Query latest balances and starting balances for all accounts
    const before = await this.batchFetchBalances(allAddrs, from - 1, false); // clear cache during fetch
    const after = await this.batchFetchBalances(allAddrs, to, true); // cache balances for next load

    // If batchGetETHBalances failed (due to suspected RPC failure), don't do anything.
    if (!before || !after) return;

    const ms = Date.now() - startTime;
    console.log(
      `[ETH] loaded ${before.size} before, ${after.size} after ETH transfers ${from} ${to} in ${ms}ms`
    );

    if (this.updateLastProcessedCheckStale(from, to)) return;

    const newTransfers = allAddrs
      .map((addr) => {
        const balanceAfter = after.get(addr)!;
        const balanceBefore = before.get(addr)!;

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
    const [latestBalance, latestBlock] = this.latestBalance.get(addr) || [
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
