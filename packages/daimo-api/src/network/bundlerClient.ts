import { UserOpHex, debugJson } from "@daimo/common";
import {
  entryPointAbi,
  entryPointV06Abi,
  entryPointV06Address,
  entryPointV07Address,
} from "@daimo/contract";
import { trace } from "@opentelemetry/api";
import { BundlerJsonRpcProvider } from "userop";
import {
  Address,
  BaseError,
  ContractFunctionRevertedError,
  Hex,
  PublicClient,
  concatHex,
  hexToBigInt,
  numberToHex,
} from "viem";

import { ViemClient } from "./viemClient";
import { OpIndexer } from "../contract/opIndexer";
import { getEnvApi } from "../env";

interface GasPriceParams {
  maxFeePerGas: Hex;
  maxPriorityFeePerGas: Hex;
}

interface GasPrice {
  slow: GasPriceParams;
  standard: GasPriceParams;
  fast: GasPriceParams;
}

/** Sends userops through an ERC-4337 bundler. */
export class BundlerClient {
  provider: BundlerJsonRpcProvider;

  constructor(bundlerRpcUrl: string, private opIndexer?: OpIndexer) {
    this.provider = new BundlerJsonRpcProvider(bundlerRpcUrl);
  }

  async sendUserOp(opHash: Hex, op: UserOpHex, viemClient: ViemClient) {
    console.log(`[BUNDLER] submitting userOp: ${JSON.stringify(op)}`);

    if (this.opIndexer) {
      const opStart = Date.now();
      const span = trace.getTracer("daimo-api").startSpan("bundler.submit");
      this.opIndexer.addCallback(opHash, (userOp) => {
        span.setAttributes({
          "op.hash": userOp.hash,
          "op.tx_hash": userOp.transactionHash,
          "op.log_index": userOp.logIndex,
        });
        span.end();
        const elapsedMs = (Date.now() - opStart) | 0;
        console.log(`[BUNDLER] user op completed in ${elapsedMs}ms`);
      });
    }

    await this.sendUncompressedBundle(op, viemClient);
    console.log(`[BUNDLER] submitted uncompressed op ${opHash}`);
    return opHash;
  }

  async getOpHash(op: UserOpHex, publicClient: PublicClient) {
    // TODO: use v0.6 for DAv1, v0.7 for DAv2
    const hashV06 = await publicClient.readContract({
      abi: entryPointV06Abi,
      address: entryPointV06Address,
      functionName: "getUserOpHash",
      args: [userOpV06FromHex(op)],
    });
    const hashV07 = await publicClient.readContract({
      abi: entryPointAbi,
      address: entryPointV07Address,
      functionName: "getUserOpHash",
      args: [packedUserOpFromHex(op)],
    });

    console.log(`[BUNDLER] ophash: ${debugJson({ hashV06, hashV07 })}`);

    return hashV06;
  }

  /// Send uncompressed. Used for ops for which we don't yet have an inflator.
  private async sendUncompressedBundle(op: UserOpHex, viemClient: ViemClient) {
    // TODO: support EntryPoint v0.7 / DAv2 ops

    const beneficiary = viemClient.account.address;
    try {
      const txHash = await viemClient.writeContract({
        abi: entryPointV06Abi,
        address: entryPointV06Address as Address,
        functionName: "handleOps",
        args: [[userOpV06FromHex(op)], beneficiary],
      });
      console.log(`[BUNDLER] submitted uncompressed bundle: ${txHash}`);
      return txHash;
    } catch (err) {
      if (err instanceof BaseError) {
        const revertError = err.walk(
          (err) => err instanceof ContractFunctionRevertedError
        );
        if (revertError instanceof ContractFunctionRevertedError) {
          const errorName = revertError.data?.errorName ?? "";
          const reason = revertError.reason;
          console.log(
            `[BUNDLER] error submitting uncompressed bundle: ${errorName} ${reason}`
          );
        }
      }
    }
  }

  async getUserOperationGasPriceParams() {
    console.log(`[BUNDLER] fetching gas price params`);
    const gasPrice = (await this.provider.send(
      "pimlico_getUserOperationGasPrice",
      []
    )) as GasPrice;
    console.log(
      `[BUNDLER] fetched gas price params: ${JSON.stringify(gasPrice)}`
    );
    return gasPrice.fast;
  }
}

/** Requires DAIMO_BUNDLER_RPC_URL. */
export function getBundlerClientFromEnv(opIndexer?: OpIndexer) {
  return new BundlerClient(getEnvApi().DAIMO_BUNDLER_RPC, opIndexer);
}

function packedUserOpFromHex(op: UserOpHex) {
  return {
    sender: op.sender,
    nonce: hexToBigInt(op.nonce),
    initCode: op.initCode,
    callData: op.callData,
    accountGasLimits: packAccountGasLimits({
      verificationGasLimit: hexToBigInt(op.verificationGasLimit),
      callGasLimit: hexToBigInt(op.callGasLimit),
    }),
    preVerificationGas: hexToBigInt(op.preVerificationGas),
    gasFees: packGasFees({
      maxPriorityFeePerGas: hexToBigInt(op.maxPriorityFeePerGas),
      maxFeePerGas: hexToBigInt(op.maxFeePerGas),
    }),
    paymasterAndData: op.paymasterAndData,
    signature: op.signature,
  };
}

function packAccountGasLimits({
  verificationGasLimit,
  callGasLimit,
}: {
  verificationGasLimit: bigint;
  callGasLimit: bigint;
}) {
  return packHiLo(verificationGasLimit, callGasLimit);
}

function packGasFees({
  maxPriorityFeePerGas,
  maxFeePerGas,
}: {
  maxPriorityFeePerGas: bigint;
  maxFeePerGas: bigint;
}) {
  return packHiLo(maxPriorityFeePerGas, maxFeePerGas);
}

function packHiLo(hi: bigint, lo: bigint) {
  return concatHex([
    numberToHex(hi, { size: 16 }),
    numberToHex(lo, { size: 16 }),
  ]);
}

/** DAv1 backcompat: format a userop for EntryPoint v0.6 */
function userOpV06FromHex(op: UserOpHex) {
  return {
    callData: op.callData,
    callGasLimit: hexToBigInt(op.callGasLimit),
    initCode: op.initCode,
    maxFeePerGas: hexToBigInt(op.maxFeePerGas),
    maxPriorityFeePerGas: hexToBigInt(op.maxPriorityFeePerGas),
    preVerificationGas: hexToBigInt(op.preVerificationGas),
    verificationGasLimit: hexToBigInt(op.verificationGasLimit),
    nonce: hexToBigInt(op.nonce),
    paymasterAndData: op.paymasterAndData,
    sender: op.sender,
    signature: op.signature,
  };
}
