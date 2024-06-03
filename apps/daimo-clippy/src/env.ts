import { DaimoChain, getChainConfig } from "@daimo/contract";

// || prevents build failures during CI
export const chainConfig = getChainConfig(
  (process.env.DAIMO_CHAIN || "baseSepolia") as DaimoChain,
);
