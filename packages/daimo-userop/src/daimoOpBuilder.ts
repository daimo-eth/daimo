import {
  ChainGasConstants,
  DEFAULT_USEROP_CALL_GAS_LIMIT,
  DEFAULT_USEROP_VERIFICATION_GAS_LIMIT,
  DaimoAccountCall,
  assert,
} from "@daimo/common";
import { daimoAccountABI } from "@daimo/contract";
import { IUserOperationMiddlewareCtx, UserOperationBuilder } from "userop";
import {
  Address,
  Hex,
  bytesToHex,
  concat,
  encodeFunctionData,
  hexToBytes,
  numberToBytes,
} from "viem";

import { SigningCallback } from "./callback";
import { DaimoNonce } from "./nonce";

// Metadata for a userop: nonce and paymaster constant.
export type DaimoOpMetadata = {
  nonce: DaimoNonce;
  chainGasConstants: ChainGasConstants;
};

/** Creates userops from a Daimo account.  */
export class DaimoOpBuilder extends UserOperationBuilder {
  /** Execution deadline */
  private validUntil = 0;

  private constructor(
    private accountAddress: Address,
    private accountVersion: "v1" | "v2",
    private signer: SigningCallback
  ) {
    super();
  }

  /** Client is used for simulation. Paymaster pays for userops. */
  public static async init(
    accountAddress: Address,
    accountVersion: "v1" | "v2",
    accountSigner: SigningCallback
  ): Promise<DaimoOpBuilder> {
    const instance = new DaimoOpBuilder(
      accountAddress,
      accountVersion,
      accountSigner
    );

    console.log(`[OP]: init DaimoOpBuilder for ${instance.accountAddress}`);
    const base = instance
      .useDefaults({
        sender: instance.accountAddress,
        verificationGasLimit: DEFAULT_USEROP_VERIFICATION_GAS_LIMIT,
        callGasLimit: DEFAULT_USEROP_CALL_GAS_LIMIT,
      })
      .useMiddleware(instance.signingCallback);

    return base;
  }

  /** Signs userops. Signer can use the enclave, which checks user presence. */
  private signingCallback = async (ctx: IUserOperationMiddlewareCtx) => {
    // Op hash
    const hexOpHash = ctx.getUserOpHash() as Hex;
    assert(hexOpHash.startsWith("0x"));
    const bOpHash = hexToBytes(hexOpHash);

    // validUntil = a property of the signature, not part of the userop
    const bValidUntil = numberToBytes(this.validUntil, { size: 6 });

    if (this.accountVersion === "v1") {
      const bVersion = numberToBytes(1, { size: 1 });
      const bMsg = concat([bVersion, bValidUntil, bOpHash]);

      const { keySlot, encodedSig } = await this.signer(bytesToHex(bMsg));

      const bKeySlot = numberToBytes(keySlot, { size: 1 });

      ctx.op.signature = concat([
        bVersion,
        bValidUntil,
        bKeySlot,
        hexToBytes(encodedSig),
      ]);
    } else {
      // DaimoAccountV2 has a simpler signature format.
      const bMsg = concat([bValidUntil, bOpHash]);
      const { encodedSig } = await this.signer(bytesToHex(bMsg));
      ctx.op.signature = concat([bValidUntil, hexToBytes(encodedSig)]);
    }
  };

  /** Sets user-op nonce and fee payment metadata. */
  setOpMetadata(opMetadata: DaimoOpMetadata) {
    return this.setNonce(opMetadata.nonce.toHex())
      .setMaxFeePerGas(opMetadata.chainGasConstants.maxFeePerGas)
      .setMaxPriorityFeePerGas(
        opMetadata.chainGasConstants.maxPriorityFeePerGas
      )
      .setPreVerificationGas(opMetadata.chainGasConstants.preVerificationGas)
      .setPaymasterAndData(opMetadata.chainGasConstants.paymasterAddress);
  }

  /** Sets a deadline for this userop to execute. */
  setValidUntil(validUntil: number) {
    this.validUntil = validUntil;
    return this;
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
