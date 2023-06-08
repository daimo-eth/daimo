import { createContext, useEffect, useState } from "react";
import { PublicClient, createPublicClient, http } from "viem";

import { generateKeypair } from "./crypto";
import { Account, useAccount } from "./account";
import { baseGoerli, mainnet } from "./constants";
import { trpc } from "./trpc";
import { check } from "./validation";

// Reads chain state (L1 / L2 health) and Daimo account state from L2.
export interface Chain {
  getStatus(): Promise<ChainStatus>;

  updateAccount(account: Account, status: ChainStatus): Promise<Account>;

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

  async updateAccount(account: Account, status: ChainStatus): Promise<Account> {
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

  async updateAccount(account: Account, status: ChainStatus): Promise<Account> {
    check(status.status === "ok", "Chain status is not ok");

    const blockNumber = BigInt(status.l2.blockHeight);
    const { address } = account;
    const bal = await this.clientL2.getBalance({ address, blockNumber });

    return {
      ...account,
      lastBalance: bal,
      lastNonce: BigInt(0), // TODO
      lastBlockTimestamp: status.l2.blockTimestamp,
    };
  }
}

/** Deploys a new contract wallet and registers it under a given username. */
export function useCreateAccount() {
  // Generate keypair
  // TODO: integrate with secure enclave
  const [keypairPromise] = useState(generateKeypair);

  // Create contract onchain, claim name.
  const result = trpc.deployWallet.useMutation();
  const createAccount = async (name: string) => {
    const pubKeyHex = `0x${(await keypairPromise).pubKeyHex}`;
    result.mutate({ name, pubKeyHex });
  };

  // Once account creation succeeds, save the account
  const [account, setAccount] = useAccount();
  useEffect(() => {
    if (account) return;
    if (!result.isSuccess) return;
    if (!result.variables || !result.variables.name) return;
    const { name } = result.variables;

    const { status, address } = result.data;
    if (status !== "success") return;

    console.log(`[CHAIN] created new account ${name} at ${address}`);
    setAccount({
      name,

      address,
      lastBalance: BigInt(0),
      lastNonce: BigInt(0),
      lastBlockTimestamp: 0,

      keypair: keypairPromise,
    });
  }, [result.isSuccess]);

  return {
    ...result,
    createAccount,
  };
}
