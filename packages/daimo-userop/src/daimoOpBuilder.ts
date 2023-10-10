import {
  ChainGasConstants,
  DEFAULT_USEROP_CALL_GAS_LIMIT,
  DEFAULT_USEROP_VERIFICATION_GAS_LIMIT,
  DaimoAccountCall,
  assert,
} from "@daimo/common";
import { daimoAccountABI, tokenMetadata } from "@daimo/contract";
import { p256 } from "@noble/curves/p256";
import { IUserOperationMiddlewareCtx, UserOperationBuilder } from "userop";
import {
  Address,
  Hex,
  bytesToBigint,
  bytesToHex,
  concat,
  encodeFunctionData,
  hexToBytes,
  numberToBytes,
} from "viem";

import { DaimoNonce } from "./nonce";
import { SigningCallback } from "./signingCallback";

// Metadata for a userop: nonce and paymaster constant.
export type DaimoOpMetadata = {
  nonce: DaimoNonce;
  chainGasConstants: ChainGasConstants;
};

/** Creates userops from a Daimo account.  */
export class DaimoOpBuilder extends UserOperationBuilder {
  /** Daimo account address */
  private address: `0x${string}` = "0x";

  /** Execution deadline */
  private validUntil = 0;

  private constructor(private signer: SigningCallback) {
    super();
  }

  /** Client is used for simulation. Paymaster pays for userops. */
  public static async init(
    deployedAddress: Address,
    signUserOperation: SigningCallback
  ): Promise<DaimoOpBuilder> {
    const instance = new DaimoOpBuilder(signUserOperation);
    instance.address = deployedAddress;

    console.log(`[OP]: init address ${instance.address}`);
    const base = instance
      .useDefaults({
        sender: instance.address,
        verificationGasLimit: DEFAULT_USEROP_VERIFICATION_GAS_LIMIT,
        callGasLimit: DEFAULT_USEROP_CALL_GAS_LIMIT,
      })
      .useMiddleware(instance.signingCallback);

    return base;
  }

  /** Signs userops. Signer can use the enclave, requesting user permission as needed. */
  private signingCallback = async (ctx: IUserOperationMiddlewareCtx) => {
    const hexOpHash = ctx.getUserOpHash() as Hex;
    assert(hexOpHash.startsWith("0x"));

    const bVersion = numberToBytes(1, { size: 1 });
    const bValidUntil = numberToBytes(this.validUntil, { size: 6 });
    const bOpHash = hexToBytes(hexOpHash);
    const bMsg = concat([bVersion, bValidUntil, bOpHash]);
    const bareHexMsg = bytesToHex(bMsg).slice(2); // no 0x prefix

    // Get P256 signature, typically from a hardware enclave
    const { derSig, keySlot } = await this.signer(bareHexMsg);

    // Parse signature
    const bKeySlot = numberToBytes(keySlot, { size: 1 });
    const parsedSignature = p256.Signature.fromDER(derSig);
    const bSig = hexToBytes(`0x${parsedSignature.toCompactHex()}`);
    assert(bSig.length === 64, "signature is not 64 bytes");
    const bR = bSig.slice(0, 32);
    const bS = bSig.slice(32);

    // Avoid malleability. Ensure low S (<= N/2 where N is the curve order)
    let s = bytesToBigint(bS);
    const n = BigInt(
      "0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551"
    );
    if (s > n / 2n) {
      s = n - s;
    }
    const bLowS = numberToBytes(s, { size: 32 });

    ctx.op.signature = concat([bVersion, bValidUntil, bKeySlot, bR, bLowS]);
  };

  /** Sets user-op nonce and fee payment metadata. */
  setOpMetadata(opMetadata: DaimoOpMetadata) {
    return this.setNonce(opMetadata.nonce.toHex())
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
    return this.setOpMetadata(opMetadata)
      .setPaymasterAndData(tokenMetadata.paymasterAddress)
      .setCallData(
        encodeFunctionData({
          abi: daimoAccountABI,
          functionName: "executeBatch",
          args: [calls],
        })
      );
  }
}
