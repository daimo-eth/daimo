import { assert } from "@daimo/common";
import AwaitLock from "await-lock";
import {
  Abi,
  Account,
  Address,
  Chain,
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
  isHex,
  webSocket,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { chainConfig } from "../env";
import { Telemetry } from "../server/telemetry";
import { memoize } from "../utils/func";

/**
 * Loads a wallet from the local DAIMO_API_PRIVATE_KEY env var.
 * This account sponsors gas for account creation (and a faucet, on testnet).
 */
export function getViemClientFromEnv(monitor: Telemetry) {
  // Connect to L1
  const l1Client = createPublicClient({
    chain: chainConfig.chainL1,
    transport: webSocket(process.env.DAIMO_API_L1_RPC_WS),
  });

  // Connect to L2
  const chain = chainConfig.chainL2;
  const account = getEOA(process.env.DAIMO_API_PRIVATE_KEY);
  const transport = webSocket(process.env.DAIMO_API_L2_RPC_WS);
  const publicClient = createPublicClient({ chain, transport });
  const walletClient = createWalletClient({ chain, transport, account });

  return new ViemClient(l1Client, publicClient, walletClient, monitor);
}

export function getEOA(privateKey?: string) {
  if (!privateKey) throw new Error("Missing private key");

  if (!privateKey.startsWith("0x")) privateKey = `0x${privateKey}`;
  assert(isHex(privateKey) && privateKey.length === 66, "Invalid private key");

  return privateKeyToAccount(privateKey);
}

/**
 * All access to the chain goes thru this client. A ViemClient lets you read L1,
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
    private telemetry: Telemetry
  ) {
    this.account = this.walletClient.account;
  }

  getEnsAddress = memoize(
    async (a: { name: string }) => {
      try {
        return await this.l1Client.getEnsAddress(a);
      } catch (e: any) {
        console.log(`[CHAIN] getEnsAddr ${a.name} error: ${e.message}`);
        return null;
      }
    },
    ({ name }: { name: string }) => name
  );

  getEnsName = memoize(
    (a: { address: Address }) => this.l1Client.getEnsName(a),
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
      console.log(`[CHAIN] waitForReceipt ${hash}: ${JSON.stringify(receipt)}`);
      if (receipt.status !== "success") {
        this.onReceiptError(hash, JSON.stringify(receipt));
      }
    } catch (e) {
      console.error(`[CHAIN] waitForReceipt error: ${e}`);
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
      `[CHAIN] nonce: got tx count ${txCount}, updating nonce ${this.nextNonce}`
    );
    this.nextNonce = Math.max(this.nextNonce, txCount);
  }

  private async runWithOverrideParams<
    Args extends { nonce?: number; gas?: bigint },
    Ret
  >(args: Args, fn: (args: Args) => Ret): Promise<Ret> {
    const startMs = performance.now();
    const localTxId = Math.floor(Math.random() * 1e6);
    console.log(
      `[CHAIN] ready to run $${localTxId} with override, waiting for lock`
    );
    await this.lockNonce.acquireAsync();

    try {
      console.log(
        `[CHAIN] tx ${localTxId} ${performance.now() - startMs}ms: got lock`
      );
      await this.updateNonce();
      console.log(
        `[CHAIN] tx ${localTxId} ${performance.now() - startMs}ms: got nonce ${
          this.nextNonce
        }`
      );

      args.nonce = this.nextNonce; // Override nonce
      args.gas = 2_000_000n; // Saves estimateGas roundtrip

      const ret = await fn(args);

      console.log(
        `[CHAIN] tx ${localTxId} ${
          performance.now() - startMs
        }ms: submitted ${ret}`
      );

      // Increment nonce for later
      this.nextNonce += 1;
      return ret;
    } finally {
      this.lockNonce.release();
    }
  }

  async writeContract<
    const TAbi extends Abi | readonly unknown[],
    TFunctionName extends string,
    TChainOverride extends Chain | undefined = undefined
  >(
    args: WriteContractParameters<
      TAbi,
      TFunctionName,
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
    console.log(`[CHAIN] send ${args.to}, waiting for lock`);
    const ret = await this.runWithOverrideParams(
      args,
      this.walletClient.sendTransaction
    );
    this.waitForReceipt(ret);
    return ret;
  }
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
