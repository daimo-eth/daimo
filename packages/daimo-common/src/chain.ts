/**
 * All chains that support a Daimo account.
 *
 * Each chain must also support CCTP:
 * https://developers.circle.com/stablecoins/docs/supported-domains
 */

import { DaimoChain } from "@daimo/contract";

import {
  ForeignToken,
  arbitrumSepoliaUSDC,
  arbitrumSepoliaWETH,
  arbitrumUSDC,
  arbitrumWETH,
  avalancheFujiUSDC,
  avalancheUSDC,
  avalancheWETH,
  baseSepoliaUSDC,
  baseSepoliaWETH,
  baseUSDC,
  baseWETH,
  optimismSepoliaUSDC,
  optimismSepoliaWETH,
  optimismUSDC,
  optimismWETH,
  polygonSepoliaUSDC,
  polygonUSDC,
  polygonWETH,
} from "./foreignToken";

export type AccountChain = {
  chainId: number;
  name: string;
  cctpDomain: number;
  bridgeCoin: ForeignToken;
  nativeWETH?: ForeignToken; // TODO: nativeWETH or nativeToken?
  isTestnet?: boolean;
};

export const base: AccountChain = {
  chainId: 8453,
  name: "base",
  cctpDomain: 6,
  bridgeCoin: baseUSDC,
  nativeWETH: baseWETH,
};

export const baseSepolia: AccountChain = {
  chainId: 84532,
  name: "baseSepolia",
  cctpDomain: 6,
  bridgeCoin: baseSepoliaUSDC,
  nativeWETH: baseSepoliaWETH,
  isTestnet: true,
};

export const arbitrum: AccountChain = {
  chainId: 42161,
  name: "arbitrum",
  cctpDomain: 3,
  bridgeCoin: arbitrumUSDC,
  nativeWETH: arbitrumWETH,
};

export const arbitrumSepolia: AccountChain = {
  chainId: 421614,
  name: "arbitrumSepolia",
  cctpDomain: 3,
  bridgeCoin: arbitrumSepoliaUSDC,
  nativeWETH: arbitrumSepoliaWETH,
  isTestnet: true,
};

export const optimism: AccountChain = {
  chainId: 10,
  name: "optimism",
  cctpDomain: 2,
  bridgeCoin: optimismUSDC,
  nativeWETH: optimismWETH,
};

export const optimismSepolia: AccountChain = {
  chainId: 11155420,
  name: "optimismSepolia",
  cctpDomain: 2,
  bridgeCoin: optimismSepoliaUSDC,
  nativeWETH: optimismSepoliaWETH,
  isTestnet: true,
};

export const polygon: AccountChain = {
  chainId: 137,
  name: "polygon",
  cctpDomain: 7,
  bridgeCoin: polygonUSDC,
  nativeWETH: polygonWETH,
};

export const polygonAmoy: AccountChain = {
  chainId: 80002,
  name: "polygonSepolia",
  cctpDomain: 7,
  bridgeCoin: polygonSepoliaUSDC,
  isTestnet: true,
};

export const avalanche: AccountChain = {
  chainId: 43114,
  name: "avalanche",
  cctpDomain: 1,
  bridgeCoin: avalancheUSDC,
  nativeWETH: avalancheWETH,
};

export const avalancheFuji: AccountChain = {
  chainId: 43113,
  name: "avalancheFuji",
  cctpDomain: 1,
  bridgeCoin: avalancheFujiUSDC,
  isTestnet: true,
};

/** Given a chain ID, return the chain. */
export function getAccountChain(chainId: number): AccountChain {
  switch (chainId) {
    case base.chainId:
      return base;
    case baseSepolia.chainId:
      return baseSepolia;
    case arbitrum.chainId:
      return arbitrum;
    case arbitrumSepolia.chainId:
      return arbitrumSepolia;
    case optimism.chainId:
      return optimism;
    case optimismSepolia.chainId:
      return optimismSepolia;
    case polygon.chainId:
      return polygon;
    case polygonAmoy.chainId:
      return polygonAmoy;
    case avalanche.chainId:
      return avalanche;
    case avalancheFuji.chainId:
      return avalancheFuji;
    default:
      throw new Error(`Unknown chainId ${chainId}`);
  }
}

/** Returnt the chain name for the given chainId. */
export function getChainName(chainId: number): string {
  return getAccountChain(chainId).name;
}

/** Returns the CCTP domain for the given chainId. */
export function getCctpDomain(chainId: number): number {
  return getAccountChain(chainId).cctpDomain;
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
