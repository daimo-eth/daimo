// Message signature, along with key slot identifying the signing keypair.
export interface SigResponse {
  // Signing key slot, see DaimoAccount.sol
  keySlot: number;
  // Hex DER signature
  derSig: string;
}

export type SigningCallback = (msgHex: string) => Promise<SigResponse>;
