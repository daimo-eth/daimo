import {
  ChainGasConstants,
  DEFAULT_USEROP_CALL_GAS_LIMIT,
  DEFAULT_USEROP_PREVERIFICATION_GAS_LIMIT,
  DEFAULT_USEROP_VERIFICATION_GAS_LIMIT,
  DaimoAccountCall,
  assert,
} from "@daimo/common";
import { daimoAccountABI } from "@daimo/contract";
import { p256 } from "@noble/curves/p256";
import {
  BundlerJsonRpcProvider,
  IUserOperationMiddlewareCtx,
  Presets,
  UserOperationBuilder,
} from "userop";
import { Address, encodeFunctionData, numberToHex } from "viem";

import { DaimoNonce } from "./nonce";
import { SigningCallback } from "./signingCallback";
import config from "../config.json";

// Metadata for a userop: nonce and paymaster constant.
export type DaimoOpMetadata = {
  nonce: DaimoNonce;
  chainGasConstants: ChainGasConstants;
};

/** Creates userops from a Daimo account.  */
export class DaimoOpBuilder extends UserOperationBuilder {
  /** Connection to the chain */
  private provider: BundlerJsonRpcProvider;

  /** Daimo account address */
  private address: `0x${string}` = "0x";

  /** Execution deadline */
  private validUntil = 0;

  private constructor(rpcUrl: string, private signer: SigningCallback) {
    super();
    this.provider = new BundlerJsonRpcProvider(rpcUrl).setBundlerRpc(
      config.bundlerRpcUrl
    );
  }

  /** Client is used for simulation. Paymaster pays for userops. */
  public static async init(
    deployedAddress: Address,
    signUserOperation: SigningCallback,
    rpcUrl: string
  ): Promise<DaimoOpBuilder> {
    const instance = new DaimoOpBuilder(rpcUrl, signUserOperation);
    instance.address = deployedAddress;

    console.log(`[OP]: init address ${instance.address}`);
    const base = instance
      .useDefaults({
        sender: instance.address,
        verificationGasLimit: DEFAULT_USEROP_VERIFICATION_GAS_LIMIT,
        callGasLimit: DEFAULT_USEROP_CALL_GAS_LIMIT,
        preVerificationGas: DEFAULT_USEROP_PREVERIFICATION_GAS_LIMIT,
      })
      .useMiddleware(
        Presets.Middleware.estimateUserOperationGas(instance.provider)
      )
      .useMiddleware(instance.signingCallback);

    return base;
  }

  /** Signs userops. Signer can use the enclave, requesting user permission as needed. */
  private signingCallback = async (ctx: IUserOperationMiddlewareCtx) => {
    const userOpHash = ctx.getUserOpHash();
    assert(userOpHash.startsWith("0x"));

    const hexVersion = "01";
    const hexValidUntil = numberToHex(this.validUntil, { size: 6 });
    const hexTx = userOpHash.slice(2);
    const hexMsg = [hexVersion, hexValidUntil, hexTx].join("");
    const { derSig, keySlot } = await this.signer(hexMsg);

    const parsedSignature = p256.Signature.fromDER(derSig);

    const hexKeySlot = numberToHex(keySlot, { size: 1 });
    const hexSig = parsedSignature.toCompactHex();

    ctx.op.signature = [hexVersion, hexValidUntil, hexKeySlot, hexSig].join("");
  };

  /** Sets user-op nonce and fee payment metadata. */
  setOpMetadata(opMetadata: DaimoOpMetadata) {
    return this.setNonce(opMetadata.nonce.toHex())
      .setPaymasterAndData(opMetadata.chainGasConstants.paymasterAndData)
      .setMaxFeePerGas(opMetadata.chainGasConstants.maxFeePerGas)
      .setMaxPriorityFeePerGas(
        opMetadata.chainGasConstants.maxPriorityFeePerGas
      );
  }

  /** Sets a deadline for this userop to execute. */
  setValidUntil(validUntil: number) {
    this.validUntil = validUntil;
  }

  executeBatch(calls: DaimoAccountCall[], opMetadata: DaimoOpMetadata) {
    return this.setOpMetadata(opMetadata).setCallData(
      encodeFunctionData({
        abi: daimoAccountABI,
        functionName: "executeBatch",
        args: [calls],
      })
    );
  }
}
