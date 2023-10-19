import { UserOpHex } from "@daimo/common";
import { Hex } from "viem";

// Message signature, along with key slot identifying the signing keypair.
export interface SigResponse {
  // Signing key slot, see DaimoAccount.sol
  keySlot: number;
  // Hex DER signature
  derSig: string;
}

/** Produces a P256 signature for a message. */
export type SigningCallback = (msgHex: string) => Promise<SigResponse>;

/**
 * Submits a signed userop, returning the userOpHash once the bundler accepts.
 * Throws an error otherwise. Does NOT wait for the op to be confirmed onchain.
 */
export type OpSenderCallback = (op: UserOpHex) => Promise<Hex>;
