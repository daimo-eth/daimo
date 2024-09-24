import { assert } from "@daimo/common";
import AwaitLock from "await-lock";
import {
  Abi,
  Account,
  Address,
  Chain,
  ContractFunctionArgs,
  ContractFunctionName,
  GetContractReturnType,
  Hex,
  PublicClient,
  SendTransactionParameters,
  SendTransactionReturnType,
  Transport,
  WalletClient,
  WriteContractParameters,
  createPublicClient,
  createWalletClient,
  fallback,
  getAddress,
  hexToBigInt,
  http,
  isHex,
  webSocket,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { IExternalApiCache } from "../db/externalApiCache";
import { chainConfig, getEnvApi } from "../env";
import { Telemetry } from "../server/telemetry";
import { lazyCache } from "../utils/cache";
import { memoize } from "../utils/func";

function getTransportFromEnv() {
  const l1RPCs = getEnvApi().DAIMO_API_L1_RPC_WS.split(",");
  const l2RPCs = getEnvApi().DAIMO_API_L2_RPC_WS.split(",");

  console.log(`[VIEM] using transport RPCs L1: ${l1RPCs}, L2: ${l2RPCs}`);

  const stringToTransport = (url: string) => {
    const rpc = url.startsWith("wss") ? webSocket(url) : http(url);
    return addLogging(rpc, url);
  };

  return {
    l1: fallback(l1RPCs.map(stringToTransport), { rank: true }),
    l2: fallback(l2RPCs.map(stringToTransport), { rank: true }),
  };
}

// Log JSON RPC requests. This helps debug RPC errors.
function addLogging(transport: Transport, url: string) {
  return (args: Parameters<Transport>[0]) => {
    const chainId = args.chain?.id;
    const ret = transport(args);
    const { request } = ret;
    ret.request = async (args) => {
      const reqID = Math.floor(Math.random() * 1e6).toString(36);
      const { method } = args;
      console.log(`[VIEM] request ${chainId} ${method} ${reqID} ${url}`);
      try {
        const resp = (await request(args)) as any;
        const detail =
          method === "eth_blockNumber" ? ` ${hexToBigInt(resp as Hex)}` : "";
        console.log(`[VIEM] response ${chainId} ${method} ${reqID}${detail}`);
        return resp;
      } catch (e) {
        console.error(`[VIEM] ERROR ${chainId} ${method} ${reqID}`, e);
        throw e;
      }
    };
    return ret;
  };
}

/**
 * Loads a wallet from the local DAIMO_API_PRIVATE_KEY env var.
 * This account sponsors gas for account creation (and a faucet, on testnet).
 */
export function getViemClientFromEnv(
  monitor: Telemetry,
  extApiCache: IExternalApiCache
) {
  const transports = getTransportFromEnv();

  // Connect to L1
  const l1Client = createPublicClient({
    chain: chainConfig.chainL1,
    transport: transports.l1,
  });

  // Connect to L2
  const chain = chainConfig.chainL2;
  const account = getEOA(getEnvApi().DAIMO_API_PRIVATE_KEY);
  const publicClient = createPublicClient({
    chain,
    transport: transports.l2,
  });
  const walletClient = createWalletClient({
    chain,
    transport: transports.l2,
    account,
  });

  return new ViemClient(
    l1Client,
    publicClient,
    walletClient,
    monitor,
    extApiCache
  );
}

export function getEOA(privateKey: string) {
  if (!privateKey.startsWith("0x")) privateKey = `0x${privateKey}`;
  assert(isHex(privateKey) && privateKey.length === 66, "Invalid private key");

  return privateKeyToAccount(privateKey);
}

/**
 * All access to the chain goes through this client. A ViemClient lets you read L1,
 * read L2, and post transactions to L2.
 */
export class ViemClient {
  // Lock to ensure sequential nonce for walletClient writes
  private lockNonce = new AwaitLock();
  private nextNonce = 0;
  public account: Account;

  constructor(
    private l1Client: PublicClient<Transport, Chain>,
    public publicClient: PublicClient<Transport, Chain>,
    private walletClient: WalletClient<Transport, Chain, Account>,
    private telemetry: Telemetry,
    private extApiCache: IExternalApiCache
  ) {
    this.account = this.walletClient.account;
  }

  getEnsAddress = memoize(
    async ({ name }: { name: string }): Promise<Address | null> => {
      try {
        const result = await this.extApiCache.get(
          "ens-get-addr",
          name,
          () => {
            console.log(`[VIEM] getEnsAddress for '${name}'`);
            return this.l1Client.getEnsAddress({ name }).then((a) => a || "");
          },
          24 * 3600
        );
        return !result ? null : getAddress(result);
      } catch (e: any) {
        console.log(`[VIEM] getEnsAddress for '${name}' error: ${e.message}`);
        return null;
      }
    },
    ({ name }: { name: string }) => name
  );

  getEnsName = memoize(
    async ({ address }: { address: Address }) => {
      const result = await this.extApiCache.get(
        "ens-get-name",
        address,
        () => {
          console.log(`[VIEM] getEnsName for '${address}'`);
          return this.l1Client
            .getEnsName({ address })
            .then((a) => a || "")
            .catch((e) => {
              // Workaround ENS bug: failed lookups revert with an ugly error
              if (e.message.includes("out-of-bounds access")) {
                return "";
              } else {
                throw e;
              }
            });
        },
        24 * 3600
      );
      return result || null;
    },
    ({ address }: { address: Address }) => address
  );

  private onReceiptError(hash: Hex, e: unknown) {
    const explorerURL = this.publicClient.chain.blockExplorers?.default?.url;
    const txURL = `${explorerURL}/tx/${hash}`;
    this.telemetry.recordClippy(
      `Receipt error ${hash} - ${txURL}: ${e}`,
      "error"
    );
  }

  private async waitForReceipt(hash: Hex) {
    try {
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
      });
      console.log(`[VIEM] waitForReceipt ${hash}: ${JSON.stringify(receipt)}`);
      if (receipt.status !== "success") {
        this.onReceiptError(hash, JSON.stringify(receipt));
      }
    } catch (e) {
      console.error(`[VIEM] waitForReceipt ${hash} error: ${e}`);
      this.onReceiptError(hash, e);
    }
  }

  // We do this to avoid race conditions with nonces. We can't rely on
  // Viem to do this for us, as it's not atomic. Other places that use
  // similar logic include Pimlico's Alto bundler:
  // https://github.com/pimlicolabs/alto/blob/main/src/entrypoint-0.6/executor/executor.ts
  private async updateNonce() {
    const txCount = await this.publicClient.getTransactionCount({
      address: this.walletClient.account.address,
      blockTag: "pending",
    });
    console.log(
      `[VIEM] nonce: got tx count ${txCount}, updating nonce ${this.nextNonce}`
    );
    this.nextNonce = Math.max(this.nextNonce, txCount);
  }

  private async runWithOverrideParams<
    Args extends {
      nonce?: number;
      gas?: bigint;
      chain?: Chain | null;
    },
    Ret
  >(args: Args, fn: (args: Args) => Ret): Promise<Ret> {
    const startMs = performance.now();
    const localTxId = Math.floor(Math.random() * 1e6);
    console.log(
      `[VIEM] ready to run ${localTxId} with override, waiting for lock`
    );
    await this.lockNonce.acquireAsync();

    try {
      const elapsedMs = () => (performance.now() - startMs) | 0;
      console.log(`[VIEM] tx ${localTxId} ${elapsedMs()}ms: got lock`);
      await this.updateNonce();
      console.log(
        `[VIEM] tx ${localTxId} ${elapsedMs()}ms: got nonce ${this.nextNonce}`
      );

      args.nonce = this.nextNonce; // Override nonce
      args.gas = 2_000_000n; // Saves estimateGas roundtrip
      args.chain = null; // Saves eth_chainId roundtrip, see https://github.com/wevm/viem/pull/474#discussion_r1190476819

      const ret = await fn(args);

      console.log(`[VIEM] tx ${localTxId} ${elapsedMs()}ms: submitted: ${ret}`);

      // Increment nonce for later
      this.nextNonce += 1;
      return ret;
    } finally {
      this.lockNonce.release();
    }
  }

  async writeContract<
    const TAbi extends Abi | readonly unknown[],
    TFunctionName extends ContractFunctionName<TAbi, "nonpayable" | "payable">,
    TFunctionArgs extends ContractFunctionArgs<TAbi, "nonpayable" | "payable">,
    TChainOverride extends Chain | undefined = undefined
  >(
    args: WriteContractParameters<
      TAbi,
      TFunctionName,
      TFunctionArgs,
      Chain,
      Account,
      TChainOverride
    >
  ): Promise<Hex> {
    console.log(`[CHAIN] exec ${args.functionName}`);
    const ret = await this.runWithOverrideParams(
      args,
      this.walletClient.writeContract
    );
    this.waitForReceipt(ret);
    return ret;
  }

  async sendTransaction<TChainOverride extends Chain | undefined = undefined>(
    args: SendTransactionParameters<Chain, Account, TChainOverride>
  ): Promise<SendTransactionReturnType> {
    console.log(`[VIEM] send ${args.to}, waiting for lock`);
    const ret = await this.runWithOverrideParams(
      args,
      this.walletClient.sendTransaction
    );
    this.waitForReceipt(ret);
    return ret;
  }

  getFinalizedBlock = lazyCache(
    () => {
      return this.publicClient.getBlock({ blockTag: "finalized" });
    },
    2_000,
    1_000
  );
}

export type ContractType<TAbi extends Abi> = GetContractReturnType<
  TAbi,
  PublicClient<Transport, Chain>
>;

export type ReadOnlyContractType<TAbi extends Abi> = GetContractReturnType<
  TAbi,
  PublicClient<Transport, Chain>
>;
