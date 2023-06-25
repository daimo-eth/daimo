import { Hex } from "viem";

// Random signature of correct length
export const dummySignature =
  "0xdeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddead";

export type SigningCallback = (hexMessage: string) => Promise<string>;

export function derKeyToContractFriendlyKey(derPublicKey: string): [Hex, Hex] {
  const rawPublicKey = derPublicKey.slice(-128);
  return [`0x${rawPublicKey.slice(0, 64)}`, `0x${rawPublicKey.slice(64, 128)}`];
}
