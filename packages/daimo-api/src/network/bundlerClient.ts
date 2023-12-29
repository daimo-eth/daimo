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
import { Address, Hex, PublicClient, hexToBigInt, isHex } from "viem";

import { CompressionInfo, compressBundle } from "./bundleCompression";
import { ViemClient } from "./viemClient";
import { NameRegistry } from "../contract/nameRegistry";
import { OpIndexer } from "../contract/opIndexer";
import { chainConfig } from "../env";

interface GasEstimate {
  preVerificationGas: Hex;
}

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
      [84531, "0xb742F6BC849020F1a7180fDFe02662F8Bce9d9C4" as Address],
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
    op: UserOpHex,
    viemClient: ViemClient,
    nameReg?: NameRegistry
  ) {
    console.log(`[BUNDLER] submtting userOp: ${JSON.stringify(op)}`);
    try {
      assert(nameReg != null, "nameReg required");
      const compressed = this.compress(op, nameReg);
      // Simultanously get the opHash (view function) and submit the bundle
      const [opHash] = await Promise.all([
        this.getOpHash(op, viemClient.publicClient),
        this.sendCompressedBundle(compressed, viemClient),
      ]);

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
          console.log(
            `[BUNDLER] user op completed in ${Date.now() - opStart}ms`
          );
        });
      }

      console.log(`[BUNDLER] submitted compressed op ${opHash}`);
      return opHash;
    } catch (e) {
      console.log(`[BUNDLER] cant send compressed, falling back: ${e}`);
      const [opHash] = await Promise.all([
        this.getOpHash(op, viemClient.publicClient),
        this.sendUncompressedBundle(op, viemClient),
      ]);
      return opHash;
    }
  }

  async getOpHash(op: UserOpHex, publicClient: PublicClient) {
    return publicClient.readContract({
      abi: entryPointABI,
      address: Constants.ERC4337.EntryPoint as Address,
      functionName: "getUserOpHash",
      args: [userOpFromHex(op)],
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
    const txHash = await viemClient.writeContract({
      abi: bundleBulkerABI,
      address: bundleBulkerAddress,
      functionName: "submit",
      args: [compressed],
    });
    return txHash;
  }

  /// Send uncompressed. Used for ops for which we don't yet have an inflator.
  async sendUncompressedBundle(op: UserOpHex, viemClient: ViemClient) {
    const beneficiary = viemClient.walletClient.account.address;
    const txHash = await viemClient.writeContract({
      abi: entryPointABI,
      address: Constants.ERC4337.EntryPoint as Address,
      functionName: "handleOps",
      args: [[userOpFromHex(op)], beneficiary],
    });
    console.log(`[BUNDLER] submitted uncompressed bundle: ${txHash}`);
    return txHash;
  }

  async estimatePreVerificationGas(op: UserOpHex) {
    const args = [op, Constants.ERC4337.EntryPoint];
    const gasEstimate = (await this.provider.send(
      "eth_estimateUserOperationGas",
      args
    )) as GasEstimate;
    console.log(
      `[BUNDLER] estimated userOp gas: ${JSON.stringify(op)}: ${JSON.stringify(
        gasEstimate
      )}`
    );
    assert(isHex(gasEstimate.preVerificationGas));
    return hexToBigInt(gasEstimate.preVerificationGas);
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
  const rpcUrl = process.env.DAIMO_BUNDLER_RPC || "";
  assert(rpcUrl !== "", "DAIMO_BUNDLER_RPC env var missing");
  return new BundlerClient(rpcUrl, opIndexer);
}

function userOpFromHex(op: UserOpHex) {
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
