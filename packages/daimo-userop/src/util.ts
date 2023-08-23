import { Hex } from "viem";

// Random signature of correct length
export const dummySignature =
  "0x00deaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddead";

export type SigningCallback = (hexMessage: string) => Promise<string>;
