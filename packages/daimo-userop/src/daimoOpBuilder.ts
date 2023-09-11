import { DaimoAccountCall, assert } from "@daimo/common";
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

/** Creates userops from a Daimo account.  */
export class DaimoOpBuilder extends UserOperationBuilder {
  /** Connection to the chain */
  private provider: BundlerJsonRpcProvider;

  private gasMiddleware: UserOperationMiddlewareFn;

  /** Daimo account address */
  address: `0x${string}`;

  private constructor(_paymasterMiddleware?: UserOperationMiddlewareFn) {
    super();
    this.provider = new BundlerJsonRpcProvider(config.rpcUrl).setBundlerRpc(
      config.bundlerRpcUrl
    );
    this.address = "0x";
    this.gasMiddleware =
      _paymasterMiddleware ||
      Presets.Middleware.estimateUserOperationGas(this.provider);
  }

  /** Client is used for simulation. Paymaster pays for userops. */
  public static async init(
    deployedAddress: Address,
    paymasterMiddleware: UserOperationMiddlewareFn | undefined,
    signUserOperation: SigningCallback
  ): Promise<DaimoOpBuilder> {
    const instance = new DaimoOpBuilder(paymasterMiddleware);
    instance.address = deployedAddress;

    console.log(`[OP]: init address ${instance.address}`);
    const base = instance
      .useDefaults({
        sender: instance.address,
        signature: dummySignature,
        verificationGasLimit: 2000000n,
        callGasLimit: 1000000n,
      })
      .useMiddleware(Presets.Middleware.getGasPrice(instance.provider))
      .useMiddleware(instance.gasMiddleware)
      .useMiddleware(async (ctx) => {
        ctx.op.verificationGasLimit = 2000000n;

        // Workaround: Pimlico gas price estimator seems to be too low
        // ctx.op.callGasLimit = Math.floor(Number(ctx.op.callGasLimit) * 10);
      })
      .useMiddleware(getSigningMiddleware(signUserOperation));

    return base;
  }

  executeBatch(calls: DaimoAccountCall[], nonce: DaimoNonce) {
    return this.setNonce(nonce.toHex()).setCallData(
      encodeFunctionData({
        abi: daimoAccountABI,
        functionName: "executeBatch",
        args: [calls],
      })
    );
  }
}
