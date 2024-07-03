/**
 * All chains that support a Daimo account.
 *
 * Each chain must also support CCTP:
 * https://developers.circle.com/stablecoins/docs/supported-domains
 */

import { ChainConfig, DaimoChain } from "@daimo/contract";
import { Address, zeroAddress } from "viem";

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

/** Returns the bridge coin address for the given chainId. */
export function getBridgeCoin(chainId: number): ForeignToken {
  return getAccountChain(chainId).bridgeCoin;
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

/** Get native WETH token address using chainId. */
export function getNativeWETHByChain(chainId: number): ForeignToken {
  switch (chainId) {
    case base.chainId:
      return baseWETH;
    case baseSepolia.chainId:
      return baseSepoliaWETH;
    default:
      throw new Error(`No WETH for chain ${chainId}`);
  }
}

// Checks if the token ETH or native WETH on the given chain.
export function isNativeETH(
  token: ForeignToken,
  chain: ChainConfig | number
): boolean {
  const chainId = typeof chain === "number" ? chain : chain.chainL2.id;
  return token.chainId === chainId && token.token === zeroAddress;
}

// Get native ETH placeholder pseudo-token.
export function getNativeETHForChain(
  chainId: number
): ForeignToken | undefined {
  switch (chainId) {
    case base.chainId:
    case baseSepolia.chainId:
      return {
        token: zeroAddress,
        decimals: 18,
        name: "Ethereum",
        symbol: "ETH",
        logoURI:
          "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
        chainId,
      };
    default:
      // Some chains, like Polygon PoS, don't have native ETH.
      return undefined;
  }
}

// Link token to chain.
baseUSDC.chainId = base.chainId;
baseWETH.chainId = base.chainId;

arbitrumUSDC.chainId = arbitrum.chainId;
arbitrumWETH.chainId = arbitrum.chainId;

optimismUSDC.chainId = optimism.chainId;
optimismWETH.chainId = optimism.chainId;

polygonUSDC.chainId = polygon.chainId;
polygonWETH.chainId = polygon.chainId;

avalancheUSDC.chainId = avalanche.chainId;
avalancheWETH.chainId = avalanche.chainId;

arbitrumSepoliaUSDC.chainId = arbitrumSepolia.chainId;
arbitrumSepoliaWETH.chainId = arbitrumSepolia.chainId;

optimismSepoliaUSDC.chainId = optimismSepolia.chainId;
optimismSepoliaWETH.chainId = optimismSepolia.chainId;

polygonSepoliaUSDC.chainId = polygonAmoy.chainId;
