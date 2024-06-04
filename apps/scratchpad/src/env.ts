import { DaimoChain, getChainConfig } from "@daimo/contract";

export const chainConfig = getChainConfig(
  process.env.NEXT_PUBLIC_DAIMO_CHAIN! as DaimoChain
);
