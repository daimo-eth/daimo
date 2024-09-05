import {
  bundleBulkerABI,
  bundleBulkerAddress,
  daimoOpInflatorABI,
  perOpInflatorABI,
  perOpInflatorAddress,
} from "@daimo/bulk";
import { UserOpHex, assert, lookup } from "@daimo/common";
import { entryPointABI } from "@daimo/contract";
import { trace } from "@opentelemetry/api";
import { BundlerJsonRpcProvider, Constants } from "userop";
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

import { CompressionInfo, compressBundle } from "./bundleCompression";
import { ViemClient } from "./viemClient";
import { NameRegistry } from "../contract/nameRegistry";
import { OpIndexer } from "../contract/opIndexer";
import { chainConfig, getEnvApi } from "../env";

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

  // Compression settings
  private compressionInfo: CompressionInfo | undefined;

  constructor(bundlerRpcUrl: string, private opIndexer?: OpIndexer) {
    this.provider = new BundlerJsonRpcProvider(bundlerRpcUrl);
  }

  async init(publicClient: PublicClient) {
    console.log(`[BUNDLER] init, loading compression info`);

    const opInflatorAddr = lookup(
      [84532, "0xf51Da0D79cB71B5b1f7990547838743065aA0c0d" as Address],
      [8453, "0x8ABD51A785160481DB9E638eE71A3F4Ec4B996D8" as Address]
    )(chainConfig.chainL2.id);

    const [inflatorID, opInflatorID, opInflatorCoinAddr, opInflatorPaymaster] =
      await Promise.all([
        publicClient.readContract({
          abi: bundleBulkerABI,
          address: bundleBulkerAddress,
          functionName: "inflatorToID",
          args: [perOpInflatorAddress],
        }),
        publicClient.readContract({
          abi: perOpInflatorABI,
          address: perOpInflatorAddress,
          functionName: "inflatorToID",
          args: [opInflatorAddr],
        }),
        publicClient.readContract({
          abi: daimoOpInflatorABI,
          address: opInflatorAddr,
          functionName: "coinAddr",
        }),
        publicClient.readContract({
          abi: daimoOpInflatorABI,
          address: opInflatorAddr,
          functionName: "paymaster",
        }),
      ]);
    console.log(`[BUNDLER] init done. inflatorID: ${inflatorID}`);

    this.compressionInfo = {
      inflatorAddr: perOpInflatorAddress,
      inflatorID,
      opInflatorID,
      opInflatorCoinAddr,
      opInflatorPaymaster,
    };
  }

  async sendUserOp(
    opHash: Hex,
    op: UserOpHex,
    viemClient: ViemClient,
    nameReg?: NameRegistry
  ) {
    console.log(`[BUNDLER] submitting userOp: ${JSON.stringify(op)}`);

    try {
      assert(nameReg != null, "nameReg required");
      const compressed = this.compress(op, nameReg);
      await this.sendCompressedBundle(compressed, viemClient);

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

      console.log(`[BUNDLER] submitted compressed op ${opHash}`);
      return opHash;
    } catch (e) {
      console.log(`[BUNDLER] cant send compressed, falling back: ${e}`);
      await this.sendUncompressedBundle(op, viemClient);
      return opHash;
    }
  }

  async getOpHash(op: UserOpHex, publicClient: PublicClient) {
    return publicClient.readContract({
      abi: entryPointABI,
      address: Constants.ERC4337.EntryPoint as Address,
      functionName: "getUserOpHash",
      args: [packedUserOpFromHex(op)],
    });
  }

  compress(op: UserOpHex, nameReg: NameRegistry) {
    if (this.compressionInfo == null) {
      throw new Error("can't compress, inflator info not loaded");
    }
    return compressBundle(op, this.compressionInfo, nameReg);
  }

  /// Send compressed userop. This is about 4x cheaper than sending uncompressed
  async sendCompressedBundle(compressed: Hex, viemClient: ViemClient) {
    const txHash = await viemClient.sendTransaction({
      to: bundleBulkerAddress,
      data: compressed,
    });
    return txHash;
  }

  /// Send uncompressed. Used for ops for which we don't yet have an inflator.
  async sendUncompressedBundle(op: UserOpHex, viemClient: ViemClient) {
    const beneficiary = viemClient.account.address;
    try {
      const txHash = await viemClient.writeContract({
        abi: entryPointABI,
        address: Constants.ERC4337.EntryPoint as Address,
        functionName: "handleOps",
        args: [[packedUserOpFromHex(op)], beneficiary],
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
    numberToHex(lo, { size: 32 }),
  ]);
}
