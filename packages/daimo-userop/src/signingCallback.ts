import { Hex } from "viem";

// Message signature, along with key slot identifying the signing keypair.
export interface SigResponse {
  // Signing key slot, see DaimoAccount.sol
  keySlot: number;
  // encoded bytes of Signature object from DaimoAccount.sol
  encodedSig: Hex;
}

export type SigningCallback = (msgHex: Hex) => Promise<SigResponse>;
