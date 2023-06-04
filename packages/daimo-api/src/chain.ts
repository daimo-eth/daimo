import { baseGoerli } from "@wagmi/chains";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export function createAccount(privateKey?: string) {
  if (!privateKey) throw new Error("Missing private key");
  return privateKeyToAccount(`0x${privateKey}`);
}

export const publicClient = createPublicClient({
  chain: baseGoerli,
  transport: http(),
});

export const walletClient = createWalletClient({
  chain: baseGoerli,
  transport: http(),
});
