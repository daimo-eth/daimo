import { PendingOp, UserOpHex } from "@daimo/common";
import { Hex } from "viem";

// Message signature, along with key slot identifying the signing keypair.
export interface SigResponse {
  // Signing key slot, see DaimoAccount.sol
  keySlot: number;
  // encoded bytes of Signature object from DaimoAccount.sol
  encodedSig: Hex;
}

export type SigningCallback = (msgHex: Hex) => Promise<SigResponse>;

/**
 * Submits a signed userop with optional offchain memo, returning the userOpHash
 * once the bundler accepts. Throws an error otherwise. Does NOT wait for the op
 * to be confirmed onchain.
 */
export type OpSenderCallback = (
  op: UserOpHex,
  memo?: string
) => Promise<PendingOp>;
