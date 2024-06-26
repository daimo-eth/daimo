/**
 * All chains that support a Daimo account.
 *
 * Each chain must also support CCTP:
 * https://developers.circle.com/stablecoins/docs/supported-domains
 */

import { DaimoChain } from "@daimo/contract";

import {
  ForeignToken,
  arbitrumSepoliaWETH,
  arbitrumWETH,
  avalancheWETH,
  baseSepoliaWETH,
  baseWETH,
  optimismSepoliaWETH,
  optimismWETH,
  polygonWETH,
} from "./foreignToken";

export type AccountChain = {
  chainId: number;
  name: string;
  CCTPDomain: number;
  nativeWETH?: ForeignToken;
  isTestnet?: boolean;
};

export const base: AccountChain = {
  chainId: 8453,
  name: "base",
  CCTPDomain: 6,
  nativeWETH: baseWETH,
};

export const baseSepolia: AccountChain = {
  chainId: 84532,
  name: "baseSepolia",
  CCTPDomain: 6,
  nativeWETH: baseSepoliaWETH,
  isTestnet: true,
};

export const Arbitrum: AccountChain = {
  chainId: 42161,
  name: "Arbitrum",
  CCTPDomain: 3,
  nativeWETH: arbitrumWETH,
};

export const ArbitrumSepolia: AccountChain = {
  chainId: 421614,
  name: "ArbitrumSepolia",
  CCTPDomain: 3,
  nativeWETH: arbitrumSepoliaWETH,
  isTestnet: true,
};

export const Optimism: AccountChain = {
  chainId: 10,
  name: "Optimism",
  CCTPDomain: 2,
  nativeWETH: optimismWETH,
};

export const OptimismSepolia: AccountChain = {
  chainId: 11155420,
  name: "OptimismSepolia",
  CCTPDomain: 2,
  isTestnet: true,
  nativeWETH: optimismSepoliaWETH,
};

export const Polygon: AccountChain = {
  chainId: 137,
  name: "Polygon",
  CCTPDomain: 7,
  nativeWETH: polygonWETH,
};

export const PolygonAmoy: AccountChain = {
  chainId: 80002,
  name: "PolygonSepolia",
  CCTPDomain: 7,
  isTestnet: true,
};

export const Avalanche: AccountChain = {
  chainId: 43114,
  name: "Avalanche",
  CCTPDomain: 1,
  nativeWETH: avalancheWETH,
};

export const AvalancheFuji: AccountChain = {
  chainId: 43113,
  name: "AvalancheFuji",
  CCTPDomain: 1,
  isTestnet: true,
};

/** Given a chain ID, return the chain. */
export function getAccountChain(chainId: number): AccountChain {
  switch (chainId) {
    case base.chainId:
      return base;
    case baseSepolia.chainId:
      return baseSepolia;
    case Arbitrum.chainId:
      return Arbitrum;
    case ArbitrumSepolia.chainId:
      return ArbitrumSepolia;
    case Optimism.chainId:
      return Optimism;
    case OptimismSepolia.chainId:
      return OptimismSepolia;
    case Polygon.chainId:
      return Polygon;
    case PolygonAmoy.chainId:
      return PolygonAmoy;
    case Avalanche.chainId:
      return Avalanche;
    case AvalancheFuji.chainId:
      return AvalancheFuji;
    default:
      throw new Error(`Unknown chainId ${chainId}`);
  }
}

/** Returnt the chain name for the given chainId. */
export function getChainName(chainId: number): string {
  return getAccountChain(chainId).name;
}

/** Returns the CCTP domain for the given chainId. */
export function getCCTPDomain(chainId: number): number {
  return getAccountChain(chainId).CCTPDomain;
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
