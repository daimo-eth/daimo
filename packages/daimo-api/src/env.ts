import { DaimoChain, getChainConfig } from "@daimo/contract";

// Enable JSON.stringify for BigInts
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export const chainConfig = getChainConfig(
  (process.env.NEXT_PUBLIC_DAIMO_CHAIN || "baseSepolia") as DaimoChain,
);
