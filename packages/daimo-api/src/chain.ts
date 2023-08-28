import type { AbiEvent } from "abitype";
import jsonBigInt from "json-bigint";
import fs from "node:fs/promises";
import os from "os";
import path from "path";
import {
  Abi,
  Account,
  Address,
  GetContractReturnType,
  GetLogsReturnType,
  PublicClient,
  Transport,
  WalletClient,
  createPublicClient,
  createWalletClient,
  webSocket,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { Chain, baseGoerli, mainnet } from "viem/chains";

const jsonBig = jsonBigInt({ useNativeBigInt: true });

/**
 * Loads a wallet from the local DAIMO_API_PRIVATE_KEY env var.
 * This account sponsors gas for account creation (and a faucet, on testnet).
 */
export function getViemClientFromEnv() {
  // Connect to L1
  const l1Client = createPublicClient({
    chain: mainnet,
    transport: webSocket(process.env.DAIMO_API_L1_RPC_WS),
  });

  // Connect to L2
  const chain = baseGoerli; // TODO: DAIMO_API_CHAIN once mainnet is supported
  const account = getAccount(process.env.DAIMO_API_PRIVATE_KEY);
  const transport = webSocket(process.env.DAIMO_API_L2_RPC_WS);
  const publicClient = createPublicClient({ chain, transport });
  const walletClient = createWalletClient({ chain, transport, account });

  return new ViemClient(l1Client, publicClient, walletClient);
}

export function getAccount(privateKey?: string) {
  if (!privateKey) throw new Error("Missing private key");
  return privateKeyToAccount(`0x${privateKey}`);
}

interface LogFilter<E extends AbiEvent | undefined> {
  address?: Address;
  event: E;
  callback: LogCallback<E>;
}

type LogsList<E extends AbiEvent | undefined> = GetLogsReturnType<
  E,
  E extends AbiEvent ? [E] : undefined,
  true
>;

type LogCallback<E extends AbiEvent | undefined> = (
  logs: LogsList<E>
) => void | Promise<void>;

export class ViemClient {
  private lastBlock: { number: bigint; timestamp: bigint } = {
    number: 0n,
    timestamp: 0n,
  };
  private logFilters: LogFilter<any>[] = [];
  private logCacheDir = path.join(os.homedir(), ".daimo", "logs");

  constructor(
    public l1Client: PublicClient<Transport, typeof mainnet>,
    public publicClient: PublicClient<Transport, typeof baseGoerli>,
    public walletClient: WalletClient<Transport, typeof baseGoerli, Account>
  ) {
    fs.mkdir(this.logCacheDir, { recursive: true });
  }

  async init() {
    this.lastBlock = await this.loadLastBlock();
  }

  getLastBlock() {
    return this.lastBlock;
  }

  private async loadLastBlock() {
    const latest = await this.publicClient.getBlock({ blockTag: "latest" });
    if (latest.number == null) throw new Error("Missing block number");
    return latest;
  }

  async processLogsToLatestBlock() {
    const oldTipNum = this.lastBlock.number;
    const newTip = await this.loadLastBlock();
    const newTipNum = newTip.number;
    if (newTipNum === oldTipNum) {
      console.log(`[CHAIN] logs already caught up to ${newTipNum}`);
      return;
    }
    console.log(`[CHAIN] processing logs ${oldTipNum}-${newTipNum}`);

    const promises = this.logFilters.map((filter) =>
      this.processLogs(filter, oldTipNum, newTipNum)
    );
    await Promise.all(promises);

    console.log(`[CHAIN] logs caught up to ${newTip}`);
    this.lastBlock = newTip;
  }

  async loadLogs<E extends AbiEvent | undefined>(
    filter: LogFilter<E>,
    fromBlock: bigint,
    toBlock: bigint
  ): Promise<LogsList<E>> {
    const id = `logs-${getFilterName(filter)}-${fromBlock}-${toBlock}`;

    // Cache old logs
    const blocksBehind = this.lastBlock.number - toBlock;
    const shouldCache = blocksBehind > 1000;
    if (shouldCache) {
      try {
        const cachePath = path.join(this.logCacheDir, id);
        const cache = await fs.readFile(cachePath, "utf-8");
        const ret = jsonBig.parse(cache);
        if (ret.length > 0) {
          console.log(`[CHAIN] loaded ${ret.length} cached logs ${id}`);
        }
        return ret;
      } catch (e: any) {
        if (e.code !== "ENOENT") {
          console.log(`[CHAIN] cache load error for ${id}`, e);
        }
      }
    }

    console.log(`[CHAIN] loading ${id}`);
    const logs = await retryBackoff(`logs-${id}`, () =>
      this.publicClient.getLogs<E, E extends AbiEvent ? [E] : undefined, true>({
        ...filter,
        fromBlock,
        toBlock,
        strict: true,
      })
    );
    if (shouldCache) {
      const cachePath = path.join(this.logCacheDir, id);
      await fs.writeFile(cachePath, jsonBig.stringify(logs));
    }
    return logs;
  }

  async processLogs<E extends AbiEvent | undefined>(
    filter: LogFilter<E>,
    fromBlock: bigint,
    toBlock: bigint
  ) {
    const logs = await this.loadLogs(filter, fromBlock, toBlock);
    if (logs.length > 0) {
      const ret = filter.callback(logs);
      if (ret instanceof Promise) await ret;
    }
  }

  /**
   * Pipes all onchain event logs matching a given filter to a callback.
   *
   * The promise resolves after the initial sync up to the current lastBlock.
   *
   * The callback will keep being called on each new block with matching logs.
   */
  async pipeLogs<E extends AbiEvent | undefined>(
    args: { address?: Address; event: E },
    callback: (
      logs: GetLogsReturnType<E, E extends AbiEvent ? [E] : undefined, true>
    ) => void | Promise<void>
  ) {
    const filter: LogFilter<E> = { ...args, callback };

    // Catch up to latest block
    const isTestnet = this.publicClient.chain.id === baseGoerli.id;
    const startBlock = isTestnet ? 8750000n : 0n;
    const lastBlockNum = this.lastBlock.number;
    const step = 5000n;
    for (
      let fromBlock = startBlock;
      fromBlock < lastBlockNum;
      fromBlock += step
    ) {
      let toBlock = fromBlock + step;
      if (toBlock > lastBlockNum) toBlock = lastBlockNum;
      await this.processLogs(filter, fromBlock, toBlock);
    }

    // Follow future blocks
    this.logFilters.push(filter);
  }
}

function getFilterName(filter: LogFilter<any>) {
  const ret = filter.event?.name || filter.address?.substring(0, 10);
  if (ret) return ret;
  throw new Error("Invalid filter, no event name or address");
}

export async function retryBackoff<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  for (let i = 1; i <= 10; i++) {
    try {
      return await fn();
    } catch (e) {
      console.log(`[CHAIN] ${name} retry ${i} after error: ${e}`);
      await new Promise((r) => setTimeout(r, 250 * 2 ** i));
    }
  }
  // TODO: add performance logging
  throw new Error(`too many retries: ${name}`);
}

export type ContractType<TAbi extends Abi> = GetContractReturnType<
  TAbi,
  PublicClient<Transport, Chain>,
  WalletClient<Transport, Chain, Account>
>;

export type ReadOnlyContractType<TAbi extends Abi> = GetContractReturnType<
  TAbi,
  PublicClient<Transport, Chain>
>;
