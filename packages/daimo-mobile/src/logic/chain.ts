import { createContext } from "react";
import { Address, PublicClient, createPublicClient, http } from "viem";

import { Account } from "./account";
import { baseGoerli, mainnet } from "./constants";
import { check } from "./validation";

// Interface for all Daimo onchain actions.
export interface Chain {
  getStatus(): Promise<ChainStatus>;

  createAccount(): Promise<Account>;

  getAccount(address: Address, status: ChainStatus): Promise<Account>;

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

class StubChain implements Chain {
  async getStatus(): Promise<ChainStatus> {
    throw new Error("Disconnected");
  }

  async createAccount(): Promise<Account> {
    throw new Error("Disconnected");
  }

  async getAccount(address: Address, status: ChainStatus): Promise<Account> {
    throw new Error("Disconnected");
  }
}

export const ChainContext = createContext<{
  chain: Chain;
  status: ChainStatus;
}>({ chain: new StubChain(), status: { status: "loading" } });

export class ViemChain implements Chain {
  clientL1 = createPublicClient({ chain: mainnet, transport: http() });
  clientL2 = createPublicClient({ chain: baseGoerli, transport: http() });

  async getStatus(): Promise<ChainStatus> {
    const getChainTip = async (client: PublicClient): Promise<ChainTip> => {
      const bn = await client.getBlockNumber();
      const block = await client.getBlock({ blockNumber: bn });
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
      console.error(e);
      return { status: "error", error: e as Error };
    }
  }

  async getAccount(address: Address, status: ChainStatus): Promise<Account> {
    check(status.status === "ok", "Chain status is not ok");

    const blockNumber = BigInt(status.l2.blockHeight);
    const bal = await this.clientL2.getBalance({ address, blockNumber });

    return {
      address,
      lastBalance: bal,
      lastNonce: BigInt(0), // TODO
      lastBlockTimestamp: status.l2.blockTimestamp,
    };
  }

  async createAccount(): Promise<Account> {
    // TODO
    return {
      address: "0x165d1B95a852A09d8293Dd80b357ff5b81802f91",
      lastBalance: BigInt(0),
      lastNonce: BigInt(0),
      lastBlockTimestamp: 0,
    };
  }
}
