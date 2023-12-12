import {
  bundleBulkerABI,
  bundleBulkerAddress,
  daimoTransferInflatorABI,
} from "@daimo/bulk";
import { UserOpHex, assert, lookup } from "@daimo/common";
import { entryPointABI } from "@daimo/contract";
import { trace } from "@opentelemetry/api";
import { BundlerJsonRpcProvider, Constants } from "userop";
import { Address, Hex, PublicClient, hexToBigInt, isHex } from "viem";

import { CompressionInfo, compressBundle } from "./bundleCompression";
import { ViemClient } from "./viemClient";
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

    const inflatorAddr = lookup(
      [84531, "0xc4616e117C97088c991AE0ddDead010e384C00d4" as Address],
      [8453, "0xc581c9ce986E348c8b8c47bA6CC7d51b47AE330e" as Address]
    )(chainConfig.chainL2.id);

    const [inflatorID, inflatorCoinAddr, inflatorPaymaster] = await Promise.all(
      [
        publicClient.readContract({
          abi: bundleBulkerABI,
          address: bundleBulkerAddress,
          functionName: "inflatorToID",
          args: [inflatorAddr],
        }),
        publicClient.readContract({
          abi: daimoTransferInflatorABI,
          address: inflatorAddr,
          functionName: "coinAddr",
        }),
        publicClient.readContract({
          abi: daimoTransferInflatorABI,
          address: inflatorAddr,
          functionName: "paymaster",
        }),
      ]
    );
    console.log(`[BUNDLER] init done. inflatorID: ${inflatorID}`);

    this.compressionInfo = {
      inflatorAddr,
      inflatorID,
      inflatorCoinAddr,
      inflatorPaymaster,
    };
  }

  async sendUserOp(op: UserOpHex, viemClient: ViemClient) {
    console.log(`[BUNDLER] submtting userOp: ${JSON.stringify(op)}`);
    try {
      const compressed = this.compress(op);
      // Simultanously get the opHash (view function) and submit the bundle
      const [opHash] = await Promise.all([
        this.getOpHash(op, viemClient.publicClient),
        this.sendCompressedOpToBulk(compressed, viemClient),
      ]);

      try {
        const span = trace.getTracer("daimo-api").startSpan("bundler.submit");
        this.opIndexer?.addCallback(opHash, (userOp) => {
          span.setAttributes({
            opHash: userOp.hash,
            txHash: userOp.transactionHash,
            logIndex: userOp.logIndex,
          });
          span.end();
        });
      } catch (e) {
        console.log(`[BUNDLER] error on telemetry callback ${opHash} ${e}`);
      }

      console.log(`[BUNDLER] submitted compressed op ${opHash}`);
      return opHash;
    } catch (e) {
      console.log(`[BUNDLER] cant send compressed, falling back: ${e}`);
      return await this.sendUserOpToProvider(op);
    }
  }

  async getOpHash(op: UserOpHex, publicClient: PublicClient) {
    return publicClient.readContract({
      abi: entryPointABI,
      address: Constants.ERC4337.EntryPoint as Address,
      functionName: "getUserOpHash",
      args: [
        {
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
        },
      ],
    });
  }

  compress(op: UserOpHex) {
    if (this.compressionInfo == null) {
      throw new Error("can't compress, inflator info not loaded");
    }
    return compressBundle(op, this.compressionInfo);
  }

  async sendCompressedOpToBulk(compressed: Hex, viemClient: ViemClient) {
    const txHash = await viemClient.writeContract({
      abi: bundleBulkerABI,
      address: bundleBulkerAddress,
      functionName: "submit",
      args: [compressed],
    });
    return txHash;
  }

  async sendUserOpToProvider(op: UserOpHex) {
    const args = [op, Constants.ERC4337.EntryPoint];
    const opHash = await this.provider.send("eth_sendUserOperation", args);
    assert(isHex(opHash));
    console.log(`[BUNDLER] submitted userOpHash: ${opHash}`);
    return opHash;
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
