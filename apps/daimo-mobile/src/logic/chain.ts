import { createContext, useEffect, useState } from "react";
import {
  Address,
  Log,
  PublicClient,
  createPublicClient,
  getAbiItem,
  getContract,
  http,
} from "viem";
import { baseGoerli, goerli } from "viem/chains";
import { erc20ABI } from "wagmi";

import { Account, useAccount } from "./account";
import { assert } from "./assert";
import { generateKeypair } from "./crypto";
import { notify } from "./notify";
import { trpc } from "./trpc";
import { check } from "./validation";

export const chainConfig = {
  testnet: true,
  l1: goerli,
  l2: baseGoerli,
  coinContract: "0x1B85deDe8178E18CdE599B4C9d913534553C3dBf" as Address,
};

const transferEvent = getAbiItem({ abi: erc20ABI, name: "Transfer" });
type TransferLog = Log<bigint, number, typeof transferEvent>;

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

  subscribeTransfers(address: Address): () => void {
    throw new Error("Disconnected");
  }
}

export const ChainContext = createContext<{
  chain: Chain;
  status: ChainStatus;
}>({ chain: new StubChain(), status: { status: "loading" } });

export class ViemChain implements Chain {
  clientL1 = createPublicClient({ chain: chainConfig.l1, transport: http() });

  clientL2 = createPublicClient({
    chain: chainConfig.l2,
    transport: http(),
    // TODO: webSocket("wss://base-goerli.public.blastapi.io")
    // See bug https://github.com/wagmi-dev/viem/issues/711
  });

  constructor() {
    console.log(`[CHAIN] connecting to L1 ${this.clientL1.chain.name}`);
    console.log(`[CHAIN] connecting to L2 ${this.clientL2.chain.name}`);
  }

  coinContract = getContract({
    abi: erc20ABI,
    address: chainConfig.coinContract,
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

  subscribeTransfers(address: Address): () => void {
    const onLogs = function (logs: TransferLog[]) {
      console.log(`[CHAIN] got ${logs.length} transfers for ${address}`);
      for (const log of logs) {
        if (!log.args.from || !log.args.to || !log.args.value) {
          console.warn(`[CHAIN] skipping invalid Tranfer log ${log}`);
          continue;
        }

        const amount = (Number(log.args.value) / 1e6).toFixed(2);
        if (log.args.from === address) {
          const recipient = log.args.to.substring(0, 8); // TODO
          notify(`Sent $${amount}`, `Sent USDC to ${recipient} successfully`);
        } else {
          const sender = log.args.to.substring(0, 8); // TODO
          notify(`Received $${amount}`, `Received USDC from ${sender}`);
        }
      }
    };

    console.log(`[CHAIN] subscribing to transfers for ${address}`);
    const unwatchFns = [
      this.coinContract.watchEvent.Transfer(
        { from: address },
        { onLogs, pollingInterval: 5000 }
      ),
      this.coinContract.watchEvent.Transfer(
        { to: address },
        { onLogs, pollingInterval: 5000 }
      ),
    ];

    return () => {
      console.log(`[CHAIN] unsubscribing from transfers for ${address}`);
      unwatchFns.forEach((fn) => fn());
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

    if (result.data.status !== "success") return;
    const { address } = result.data;

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
