import { createPublicClient, http } from "viem";
import { baseGoerli } from "viem/chains";

export const publicClient = createPublicClient({
  chain: baseGoerli,
  transport: http(),
});

// Random signature of correct length
export const dummySignature =
  "0xdeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddead";

export type SigningCallback = (hexMessage: string) => Promise<string>;
