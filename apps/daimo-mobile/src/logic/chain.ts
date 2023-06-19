import { tokenMetadata } from "@daimo/contract";
import { createContext } from "react";
import {
  Address,
  PublicClient,
  createPublicClient,
  getContract,
  http,
  webSocket,
} from "viem";
import { baseGoerli, goerli } from "viem/chains";
import { erc20ABI } from "wagmi";

import { assert } from "./assert";
import { check } from "./validation";
import { Account } from "../model/account";

export const chainConfig = {
  testnet: true,
  l1: goerli,
  l2: baseGoerli,
};

// Reads chain state (L1 / L2 health) and Daimo account state from L2.
export interface Chain {
  getStatus(): Promise<ChainStatus>;

  updateAccount(account: Account, status: ChainStatus): Promise<Account>;

  subscribeTransfers(address: Address): () => void;

  // TODO: send transaction, add or remove device.
}

export interface ChainTip {
  name: string;
  blockHeight: number;
  blockTimestamp: number;
}

export type ChainStatus =
  | { status: "loading" }
  | {
      status: "ok";
      l1: ChainTip;
      l2: ChainTip;
    }
  | { status: "error"; error: Error };

export const ChainContext = createContext<{
  chain?: Chain;
  status: ChainStatus;
}>({ status: { status: "loading" } });

export class Chain implements Chain {
  clientL1 = createPublicClient({ chain: chainConfig.l1, transport: http() });

  clientL2 = createPublicClient({
    chain: chainConfig.l2,
    transport: webSocket("wss://base-goerli.public.blastapi.io"),
    // See bug https://github.com/wagmi-dev/viem/issues/711
  });

  constructor() {
    console.log(`[CHAIN] connecting to L1 ${this.clientL1.chain.name}`);
    console.log(`[CHAIN] connecting to L2 ${this.clientL2.chain.name}`);
  }

  coinContract = getContract({
    abi: erc20ABI,
    address: tokenMetadata.address,
    publicClient: this.clientL2,
  });

  // TODO: subscribe, don't poll.
  async getStatus(): Promise<ChainStatus> {
    const getChainTip = async (client: PublicClient): Promise<ChainTip> => {
      assert(client.chain != null);
      const block = await client.getBlock({ blockTag: "latest" });
      return {
        name: client.chain.name,
        blockHeight: Number(block.number),
        blockTimestamp: Number(block.timestamp),
      };
    };

    try {
      return {
        status: "ok",
        l1: await getChainTip(this.clientL1),
        l2: await getChainTip(this.clientL2),
      };
    } catch (e: any) {
      console.warn(`[CHAIN] failed to load tip, skipping: ${e.message}`);
      return { status: "error", error: e as Error };
    }
  }

  async updateAccount(account: Account, status: ChainStatus): Promise<Account> {
    check(status.status === "ok", "Chain status is not ok");

    const blockNumber = BigInt(status.l2.blockHeight);
    const { address } = account;
    let lastBalance: bigint;
    try {
      const { read } = this.coinContract;
      lastBalance = await read.balanceOf([address], { blockNumber });
    } catch (e: any) {
      console.log(`[CHAIN] balance read failed, skipping. ${e.message}`);
      return account;
    }

    return {
      ...account,
      lastBalance,
      lastNonce: BigInt(0), // TODO
      lastBlockTimestamp: status.l2.blockTimestamp,
    };
  }
}
