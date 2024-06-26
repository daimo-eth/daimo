// TODO: add supported chain info. Add to chainConfig or account maybe?

import { DaimoChain } from "@daimo/contract";

import {
  ForeignToken,
  arbitrumWETH,
  baseSepoliaWETH,
  baseWETH,
} from "./foreignToken";

export type AccountChain = {
  chainId: number;
  name: string;
  nativeWETH: ForeignToken;
  isTestnet?: boolean;
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
  isTestnet: true,
};

export const Arbitrum: AccountChain = {
  chainId: 42161,
  name: "Arbitrum",
  nativeWETH: arbitrumWETH,
};

export const ArbitrumSepolia: AccountChain = {
  chainId: 421614,
  name: "ArbitrumSepolia",
  nativeWETH: arbitrumWETH,
  isTestnet: true,
};

export const Optimism: AccountChain = {
  chainId: 10,
  name: "Optimism",
};

export const OptimismSepolia: AccountChain = {
  chainId: 11155420,
  name: "OptimismSepolia",
  isTestnet: true,
};

export const Polygon: AccountChain = {
  chainId: 137,
  name: "Polygon",
};

export const PolygonAmoy: AccountChain = {
  chainId: 80002,
  name: "PolygonSepolia",
  isTestnet: true,
};

export const Avalanche: AccountChain = {
  chainId: 43114,
  name: "Avalanche",
};

export const AvalancheFuji: AccountChain = {
  chainId: 43113,
  name: "AvalancheFuji",
  isTestnet: true,
};

/** Given a chain ID, return the chain's name. */
export function getChainName(chainId: number): string {
  switch (chainId) {
    case base.chainId:
      return base.name;
    case baseSepolia.chainId:
      return baseSepolia.name;
    default:
      throw new Error(`Unknown chainId ${chainId}`);
  }
}

/** Returns whether the chainId is a testnet. */
export function isTestnetChain(chainId: number): boolean {
  if (chainId === baseSepolia.chainId) return true;
  return false;
}

/** Returns chain id from DaimoChain */
export function daimoChainToId(chain: DaimoChain): number {
  switch (chain) {
    case base.name:
      return base.chainId;
    case baseSepolia.name:
      return baseSepolia.chainId;
    default:
      throw new Error(`Unknown chain ${chain}`);
  }
}
