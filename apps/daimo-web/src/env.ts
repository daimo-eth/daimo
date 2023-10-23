import { DaimoChain, getChainConfig } from "@daimo/contract";

// || prevents build failures during CI
export const chainConfig = getChainConfig(
  (process.env.NEXT_PUBLIC_DAIMO_CHAIN || "baseGoerli") as DaimoChain
);
