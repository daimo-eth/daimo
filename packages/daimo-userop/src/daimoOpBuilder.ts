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
  Presets,
  UserOperationBuilder,
  UserOperationMiddlewareFn,
} from "userop";
import { Address, encodeFunctionData, numberToHex } from "viem";

import { DaimoNonce } from "./nonce";
import { SigningCallback, dummySignature } from "./util";
import config from "../config.json";

/** Signs userops. Signer can use the enclave, requesting user permission as needed. */
function getSigningMiddleware(
  signer: SigningCallback
): UserOperationMiddlewareFn {
  return async (ctx) => {
    const userOpHash = ctx.getUserOpHash();
    assert(userOpHash.startsWith("0x"));
    const { derSig, keySlot } = await signer(userOpHash.slice(2));

    const parsedSignature = p256.Signature.fromDER(derSig);
    ctx.op.signature = `${numberToHex(keySlot, {
      size: 1,
    })}${parsedSignature.toCompactHex()}`;
  };
}

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
  address: `0x${string}` = "0x";

  private constructor(rpcUrl: string) {
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
    const instance = new DaimoOpBuilder(rpcUrl);
    instance.address = deployedAddress;

    console.log(`[OP]: init address ${instance.address}`);
    const base = instance
      .useDefaults({
        sender: instance.address,
        signature: dummySignature,
        verificationGasLimit: DEFAULT_USEROP_VERIFICATION_GAS_LIMIT,
        callGasLimit: DEFAULT_USEROP_CALL_GAS_LIMIT,
        preVerificationGas: DEFAULT_USEROP_PREVERIFICATION_GAS_LIMIT,
      })
      .useMiddleware(
        Presets.Middleware.estimateUserOperationGas(instance.provider)
      )
      .useMiddleware(getSigningMiddleware(signUserOperation));

    return base;
  }

  setOpMetadata(opMetadata: DaimoOpMetadata) {
    return this.setNonce(opMetadata.nonce.toHex())
      .setPaymasterAndData(opMetadata.chainGasConstants.paymasterAndData)
      .setMaxFeePerGas(opMetadata.chainGasConstants.maxFeePerGas)
      .setMaxPriorityFeePerGas(
        opMetadata.chainGasConstants.maxPriorityFeePerGas
      );
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
