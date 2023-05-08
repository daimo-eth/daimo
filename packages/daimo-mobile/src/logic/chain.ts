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

export type ChainStatus =
  | { status: "loading" }
  | {
      status: "ok";
      blockHeight: number;
      blockTimestamp: number;
      l1BlockHeight: number;
      l1BlockTimestamp: number;
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
    const getLatestBlock = async (client: PublicClient) => {
      const bn = await client.getBlockNumber();
      return await client.getBlock({ blockNumber: bn });
    };
    const l1Block = await getLatestBlock(this.clientL1);
    const l2Block = await getLatestBlock(this.clientL2);

    return {
      status: "ok",
      blockHeight: Number(l2Block.number),
      blockTimestamp: Number(l2Block.timestamp),
      l1BlockHeight: Number(l1Block.number),
      l1BlockTimestamp: Number(l1Block.timestamp),
    };
  }

  async getAccount(address: Address, status: ChainStatus): Promise<Account> {
    check(status.status === "ok", "Chain status is not ok");

    const blockNumber = BigInt(status.blockHeight);
    const bal = await this.clientL2.getBalance({ address, blockNumber });

    return {
      address,
      lastBalance: bal,
      lastNonce: BigInt(0), // TODO
      lastBlockTimestamp: status.blockTimestamp,
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
