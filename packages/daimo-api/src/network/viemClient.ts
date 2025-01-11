import { assertNotNull, debugJson, retryBackoff } from "@daimo/common";
import AwaitLock from "await-lock";
import {
  Abi,
  Account,
  Address,
  Block,
  Chain,
  ContractFunctionArgs,
  ContractFunctionName,
  EstimateContractGasParameters,
  GetContractReturnType,
  Hex,
  PublicClient,
  TransactionReceipt,
  Transport,
  WalletClient,
  WriteContractParameters,
  createPublicClient,
  createWalletClient,
  getAddress,
} from "viem";

import {
  getEOA,
  getTransportFromEnv,
  isNonceAlreadyUsedError,
  isReplacementGasFeeTooLowError,
  isWaitForReceiptTimeoutError,
} from "./viemClientUtils";
import { IExternalApiCache } from "../db/externalApiCache";
import { chainConfig, getEnvApi } from "../env";
import { Telemetry } from "../server/telemetry";
import { lazyCache } from "../utils/cache";
import { memoize } from "../utils/func";

const GAS_LIMIT_RESCALE_PERCENT = 150; // Scale gas limit to 150% of estimate
const BASE_FEE_RESCALE_PERCENT = 200; // Scale base fee to 200% of original in maxFeePerGas calculation
const PRIO_FEE_SCALE_RESCALE_PERCENT = 120; // Scale priority fee to 120% of original

const REPLACEMENT_MAX_FEE_PERCENT = 200; // Replace maxFeePerGas with double previous fee
const REPLACEMENT_MAX_PRIO_FEE_PERCENT = 200; // Replace maxPriorityFeePerGas with double previous fee

function calcPercentOf(value: bigint, percent: number): bigint {
  return (value * BigInt(percent)) / 100n;
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

/**
 * All access to the chain goes through this client. A ViemClient lets you read L1,
 * read L2, and post transactions to L2.
 */
export class ViemClient {
  /** When a tx doesn't confirm, retry with higher gas n times. */
  public readonly maxWriteContractAttempts = 5;
  /** When a tx doesn't confirm, wait before retrying with higher gas. */
  public readonly writeContractRetryDelayMs = 5000;

  /** EOA for sending txs. */
  public account: Account;
  /** Lock to ensure sequential nonce for walletClient writes */
  private txLock = new AwaitLock();

  constructor(
    private l1Client: PublicClient<Transport, Chain>,
    public publicClient: PublicClient<Transport, Chain>,
    private walletClient: WalletClient<Transport, Chain, Account>,
    private telemetry: Telemetry,
    private extApiCache: IExternalApiCache
  ) {
    this.account = this.walletClient.account;
    publicClient.waitForTransactionReceipt = (args) => {
      // Viem's default is 6 = ~24s
      return publicClient.waitForTransactionReceipt({
        ...args,
        retryCount: 10,
        timeout: 60_000, // Wait at most 1 minute for a tx to confirm
      });
    };
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

  private async waitForReceipt(hash: Hex): Promise<TransactionReceipt> {
    try {
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
      });
      console.log(`[VIEM] waitForReceipt ${hash}: ${JSON.stringify(receipt)}`);
      if (receipt.status !== "success") {
        this.onReceiptError(hash, JSON.stringify(receipt));
      }
      return receipt;
    } catch (e) {
      console.error(`[VIEM] waitForReceipt ${hash} error: ${e}`);
      this.onReceiptError(hash, e);
      throw e;
    }
  }

  /** Get the nonce from the chain */
  async getNonce(block: Block): Promise<number> {
    const blockNumber = assertNotNull(block.number, "block number is null");
    return await retryBackoff(
      "getTransactionCount",
      () =>
        this.publicClient.getTransactionCount({
          address: this.walletClient.account.address,
          blockNumber,
        }),
      3
    );
  }

  /** Calculate the EIP-1559 gas prices using defensive defaults. */
  async calcGasPrice(block: Block): Promise<{
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
  }> {
    const maxPriorityFeePerGas =
      await this.publicClient.estimateMaxPriorityFeePerGas();
    const baseBlockFee = assertNotNull(
      block.baseFeePerGas,
      "baseBlockFee is null"
    );

    // Add buffer to maxFeePerGas to ensure tx can still be included in future
    // blocks even if the base fee rises.
    const baseFeeBuffer = calcPercentOf(baseBlockFee, BASE_FEE_RESCALE_PERCENT);

    // Add tip to maxPriorityFeePerGas for faster processing
    const maxPriorityFeePerGasWithTip = calcPercentOf(
      maxPriorityFeePerGas,
      PRIO_FEE_SCALE_RESCALE_PERCENT
    );

    const maxFeePerGas = baseFeeBuffer + maxPriorityFeePerGasWithTip;

    return {
      maxFeePerGas,
      maxPriorityFeePerGas: maxPriorityFeePerGasWithTip,
    };
  }

  private onEstimateGasError(argsJson: string, e: unknown) {
    const message = `[VIEM] getGasLimit error ${argsJson}: ${e}`;
    console.error(message, "error");
    this.telemetry.recordClippy(message, "error");
  }

  /** Estimate the gas limit for a tx with a defensive buffer. */
  async getGasLimit<
    const TAbi extends Abi | readonly unknown[],
    TFunctionName extends ContractFunctionName<TAbi, "payable" | "nonpayable">,
    TArgs extends ContractFunctionArgs<
      TAbi,
      "payable" | "nonpayable",
      TFunctionName
    >,
    TChainOverride extends Chain | undefined = undefined
  >(
    block: Block,
    args: WriteContractParameters<
      TAbi,
      TFunctionName,
      TArgs,
      Chain,
      Account,
      TChainOverride
    >
  ): Promise<bigint> {
    try {
      // Don't retry. estimateContractGas usually fails because of reverts
      // during simulation. We want to surface these errors.
      const gasLimit = await this.publicClient.estimateContractGas({
        address: args.address,
        abi: args.abi,
        functionName: args.functionName,
        args: args.args,
        account: this.walletClient.account.address,
        value: args.value,
        blockNumber: block.number,
      } as EstimateContractGasParameters);

      // Add buffer to the gas limit to be safe
      return calcPercentOf(gasLimit, GAS_LIMIT_RESCALE_PERCENT);
    } catch (e) {
      console.error(`[VIEM] getGasLimit error: ${e}`);
      this.onEstimateGasError(debugJson(args), e);
      throw e;
    }
  }

  /**
   * Set the override params for a tx like gas limit, maxFeePerGas,
   * maxPriorityFeePerGas, and nonce.
   */
  async setOverrideParams<
    const TAbi extends Abi | readonly unknown[],
    TFunctionName extends ContractFunctionName<TAbi, "payable" | "nonpayable">,
    TArgs extends ContractFunctionArgs<
      TAbi,
      "payable" | "nonpayable",
      TFunctionName
    >,
    TChainOverride extends Chain | undefined = undefined
  >(
    localTxId: number,
    args: WriteContractParameters<
      TAbi,
      TFunctionName,
      TArgs,
      Chain,
      Account,
      TChainOverride
    >,
    prevGasFees: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }
  ): Promise<void> {
    const block = await this.publicClient.getBlock({ blockTag: "latest" });

    const [gasLimit, nonce, { maxFeePerGas, maxPriorityFeePerGas }] =
      await Promise.all([
        this.getGasLimit(block, args),
        this.getNonce(block),
        this.calcGasPrice(block),
      ]);

    args.gas = gasLimit;
    args.nonce = nonce;

    // Increase the previous gas price to get the new tx through and avoid
    // "replacement transaction underpriced" errors.
    const replacementMaxFeePerGas = calcPercentOf(
      prevGasFees.maxFeePerGas,
      REPLACEMENT_MAX_FEE_PERCENT
    );
    const replacementMaxPriorityFeePerGas = calcPercentOf(
      prevGasFees.maxPriorityFeePerGas,
      REPLACEMENT_MAX_PRIO_FEE_PERCENT
    );

    // Use the larger of the replacement price or the current price
    args.maxFeePerGas =
      replacementMaxFeePerGas > maxFeePerGas
        ? replacementMaxFeePerGas
        : maxFeePerGas;
    args.maxPriorityFeePerGas =
      replacementMaxPriorityFeePerGas > maxPriorityFeePerGas
        ? replacementMaxPriorityFeePerGas
        : maxPriorityFeePerGas;

    console.log(
      `${this.getWriteContractLogMessage(
        localTxId,
        args
      )} Gas and nonce tx params: ${debugJson({
        chainId: this.publicClient.chain.id,
        blockNumber: block.number,
        accountAddress: this.walletClient.account.address,
        gas: args.gas,
        nonce: args.nonce,
        blockBaseFeePerGas: block.baseFeePerGas,
        maxFeePerGas: args.maxFeePerGas,
        maxPriorityFeePerGas: args.maxPriorityFeePerGas,
        prevMaxFeePerGas: prevGasFees.maxFeePerGas,
        prevMaxPriorityFeePerGas: prevGasFees.maxPriorityFeePerGas,
      })}`
    );
  }

  private getWriteContractLogMessage<
    const TAbi extends Abi | readonly unknown[],
    TFunctionName extends ContractFunctionName<TAbi, "payable" | "nonpayable">,
    TArgs extends ContractFunctionArgs<
      TAbi,
      "payable" | "nonpayable",
      TFunctionName
    >,
    TChainOverride extends Chain | undefined = undefined
  >(
    localTxId: number,
    args: WriteContractParameters<
      TAbi,
      TFunctionName,
      TArgs,
      Chain,
      Account,
      TChainOverride
    >
  ) {
    return `[VIEM] txId ${localTxId} from ${this.walletClient.account.address}: ${args.functionName} on ${args.address} chain ${this.publicClient.chain.id}`;
  }

  /**
   * Write to a contract and wait for the receipt, retrying until successful.
   */
  async writeContractAndGetReceipt<
    const TAbi extends Abi | readonly unknown[],
    TFunctionName extends ContractFunctionName<TAbi, "payable" | "nonpayable">,
    TArgs extends ContractFunctionArgs<
      TAbi,
      "payable" | "nonpayable",
      TFunctionName
    >,
    TChainOverride extends Chain | undefined = undefined
  >(
    args: WriteContractParameters<
      TAbi,
      TFunctionName,
      TArgs,
      Chain,
      Account,
      TChainOverride
    >
  ): Promise<{ txHash: Hex; receipt: TransactionReceipt }> {
    const startMs = performance.now();
    const localTxId = Math.floor(Math.random() * 1e6);
    console.log(
      `${this.getWriteContractLogMessage(
        localTxId,
        args
      )} Ready to run. Waiting for lock`
    );

    // Only one tx at a time per account to avoid nonce issues.
    await this.txLock.acquireAsync();
    const elapsedMs = () => (performance.now() - startMs) | 0;
    console.log(
      `${this.getWriteContractLogMessage(
        localTxId,
        args
      )} Got lock after ${elapsedMs()}ms`
    );

    try {
      const prevGasFees = { maxFeePerGas: 0n, maxPriorityFeePerGas: 0n };
      let finalTxHash: Hex | undefined;
      let finalReceipt: TransactionReceipt | undefined;

      let attempt = 1;

      // Keep trying to submit the tx until we get a txHash and receipt
      while (!finalTxHash || !finalReceipt) {
        if (attempt > this.maxWriteContractAttempts) {
          const message = `${this.getWriteContractLogMessage(
            localTxId,
            args
          )} max attempts (${this.maxWriteContractAttempts} attempts) reached`;
          this.telemetry.recordClippy(message, "error");
          throw new Error(message);
        }

        const txAttemptId = Math.floor(Math.random() * 1e6);
        console.log(
          `${this.getWriteContractLogMessage(
            localTxId,
            args
          )} Tx submission attempt ${attempt} with txId ${txAttemptId}`
        );

        await this.setOverrideParams(localTxId, args, prevGasFees);

        try {
          const txHash = await this.walletClient.writeContract(args);
          const receipt = await this.waitForReceipt(txHash);

          finalTxHash = txHash;
          finalReceipt = receipt;
        } catch (error) {
          // Retry only if the error is related to how the tx was submitted
          if (
            isReplacementGasFeeTooLowError(error) ||
            isWaitForReceiptTimeoutError(error) ||
            isNonceAlreadyUsedError(error)
          ) {
            console.warn(
              `${this.getWriteContractLogMessage(
                localTxId,
                args
              )} Failed tx submission attempt ${attempt} with txId ${txAttemptId}. Resubmitting...`,
              error
            );

            attempt++;
            // Update previous gas fees for the next attempt
            prevGasFees.maxFeePerGas = assertNotNull(
              args.maxFeePerGas,
              "maxFeePerGas is null. Can't update prevGasFees"
            );
            prevGasFees.maxPriorityFeePerGas = assertNotNull(
              args.maxPriorityFeePerGas,
              "maxPriorityFeePerGas is null. Can't update prevGasFees"
            );

            await new Promise((resolve) =>
              setTimeout(resolve, this.writeContractRetryDelayMs)
            );
          } else {
            const message = `${this.getWriteContractLogMessage(
              localTxId,
              args
            )} Failed tx submission attempt ${attempt} with txId ${txAttemptId}. Not retrying. Tx submission error unrelated to gas pricing.`;
            console.warn(message);
            this.telemetry.recordClippy(message, "warn");
            throw new Error(message);
          }
        }
      }

      return { txHash: finalTxHash, receipt: finalReceipt };
    } finally {
      this.txLock.release();
    }
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
