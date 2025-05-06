import {
  ChainGasConstants,
  DEFAULT_USEROP_CALL_GAS_LIMIT,
  DEFAULT_USEROP_VERIFICATION_GAS_LIMIT,
  DaimoAccountCall,
  assert,
} from "@daimo/common";
import { daimoAccountAbi } from "@daimo/contract";
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
    private signer: SigningCallback
  ) {
    super();
  }

  /** Client is used for simulation. Paymaster pays for userops. */
  public static async init(
    accountAddress: Address,
    accountSigner: SigningCallback
  ): Promise<DaimoOpBuilder> {
    const instance = new DaimoOpBuilder(accountAddress, accountSigner);

    console.log(`[OP]: init address ${instance.accountAddress}`);
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
    const hexOpHash = ctx.getUserOpHash() as Hex;
    assert(hexOpHash.startsWith("0x"));

    const bVersion = numberToBytes(1, { size: 1 });
    const bValidUntil = numberToBytes(this.validUntil, { size: 6 });
    const bOpHash = hexToBytes(hexOpHash);
    const bMsg = concat([bVersion, bValidUntil, bOpHash]);

    const { keySlot, encodedSig } = await this.signer(bytesToHex(bMsg));

    const bKeySlot = numberToBytes(keySlot, { size: 1 });

    ctx.op.signature = concat([
      bVersion,
      bValidUntil,
      bKeySlot,
      hexToBytes(encodedSig),
    ]);
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
        abi: daimoAccountAbi,
        functionName: "executeBatch",
        args: [calls],
      })
    );
  }
}
