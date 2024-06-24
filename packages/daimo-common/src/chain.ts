// TODO: add supported chain info. Add to chainConfig or account maybe?

import { ForeignToken, baseSepoliaWETH, baseWETH } from "./foreignToken";

export type AccountChain = {
  chainId: number;
  name: string;
  nativeWETH: ForeignToken;
};

export const base: AccountChain = {
  chainId: 8453,
  name: "base",
  nativeWETH: baseWETH,
};

export const baseSepolia: AccountChain = {
  chainId: 84532,
  name: "baseSepolia",
  nativeWETH: baseSepoliaWETH,
};

export function getChainName(chainId: number): string | undefined {
  switch (chainId) {
    case 8453:
    default:
      return "base";
    case 84532:
      return "baseSepolia";
  }
}
