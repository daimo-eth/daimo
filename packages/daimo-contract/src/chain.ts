/**
 * All chains that DAv2 supports (e.g. send to any chain).
 *
 * Each chain must also support CCTP:
 * https://developers.circle.com/stablecoins/docs/supported-domains
 */

import { DaimoChain } from "./chainConfig";
import {
  ForeignToken,
  arbitrumSepoliaUSDC,
  arbitrumSepoliaWETH,
  arbitrumUSDC,
  arbitrumWETH,
  avalancheFujiUSDC,
  avalancheFujiWAVAX,
  avalancheUSDC,
  avalancheWAVAX,
  baseSepoliaUSDC,
  baseSepoliaWETH,
  baseUSDC,
  baseWETH,
  ethereumSepoliaUSDC,
  ethereumSepoliaWETH,
  ethereumUSDC,
  ethereumWETH,
  optimismSepoliaUSDC,
  optimismSepoliaWETH,
  optimismUSDC,
  optimismWETH,
  polygonAmoyUSDC,
  polygonAmoyWMATIC,
  polygonUSDC,
  polygonWMATIC,
} from "./foreignToken";

/** An EVM chain supported by DaimoAccountV2. */
export type DAv2Chain = {
  chainId: number;
  name: string;
  shortName: string;
  cctpDomain: number;
  bridgeCoin: ForeignToken;
  wrappedNativeToken: ForeignToken;
  isTestnet?: boolean;
};

export const ethereum: DAv2Chain = {
  chainId: 1,
  name: "ethereum",
  shortName: "eth",
  cctpDomain: 0,
  bridgeCoin: ethereumUSDC,
  wrappedNativeToken: ethereumWETH,
};

export const ethereumSepolia: DAv2Chain = {
  chainId: 11155111,
  name: "ethereumSepolia",
  shortName: "eth",
  cctpDomain: 0,
  bridgeCoin: ethereumSepoliaUSDC,
  wrappedNativeToken: ethereumSepoliaWETH,
  isTestnet: true,
};

export const base: DAv2Chain = {
  chainId: 8453,
  name: "base",
  shortName: "base",
  cctpDomain: 6,
  bridgeCoin: baseUSDC,
  wrappedNativeToken: baseWETH,
};

export const baseSepolia: DAv2Chain = {
  chainId: 84532,
  name: "baseSepolia",
  shortName: "base",
  cctpDomain: 6,
  bridgeCoin: baseSepoliaUSDC,
  wrappedNativeToken: baseSepoliaWETH,
  isTestnet: true,
};

export const arbitrum: DAv2Chain = {
  chainId: 42161,
  name: "arbitrum",
  shortName: "arb",
  cctpDomain: 3,
  bridgeCoin: arbitrumUSDC,
  wrappedNativeToken: arbitrumWETH,
};

export const arbitrumSepolia: DAv2Chain = {
  chainId: 421614,
  name: "arbitrumSepolia",
  shortName: "arb",
  cctpDomain: 3,
  bridgeCoin: arbitrumSepoliaUSDC,
  wrappedNativeToken: arbitrumSepoliaWETH,
  isTestnet: true,
};

export const optimism: DAv2Chain = {
  chainId: 10,
  name: "optimism",
  shortName: "op",
  cctpDomain: 2,
  bridgeCoin: optimismUSDC,
  wrappedNativeToken: optimismWETH,
};

export const optimismSepolia: DAv2Chain = {
  chainId: 11155420,
  name: "optimismSepolia",
  shortName: "op",
  cctpDomain: 2,
  bridgeCoin: optimismSepoliaUSDC,
  wrappedNativeToken: optimismSepoliaWETH,
  isTestnet: true,
};

export const polygon: DAv2Chain = {
  chainId: 137,
  name: "polygon",
  shortName: "poly",
  cctpDomain: 7,
  bridgeCoin: polygonUSDC,
  wrappedNativeToken: polygonWMATIC,
};

export const polygonAmoy: DAv2Chain = {
  chainId: 80002,
  name: "polygonAmoy",
  shortName: "poly",
  cctpDomain: 7,
  bridgeCoin: polygonAmoyUSDC,
  wrappedNativeToken: polygonAmoyWMATIC,
  isTestnet: true,
};

export const avalanche: DAv2Chain = {
  chainId: 43114,
  name: "avalanche",
  shortName: "avax",
  cctpDomain: 1,
  bridgeCoin: avalancheUSDC,
  wrappedNativeToken: avalancheWAVAX,
};

export const avalancheFuji: DAv2Chain = {
  chainId: 43113,
  name: "avalancheFuji",
  shortName: "avax",
  cctpDomain: 1,
  bridgeCoin: avalancheFujiUSDC,
  wrappedNativeToken: avalancheFujiWAVAX,
  isTestnet: true,
};

const chains = [
  ethereum,
  ethereumSepolia,
  base,
  baseSepolia,
  arbitrum,
  arbitrumSepolia,
  optimism,
  optimismSepolia,
  polygon,
  polygonAmoy,
  avalanche,
  avalancheFuji,
];

/** Supported chains for send (+ soon receive). */
export function getDAv2Chains(isTestnet: boolean): DAv2Chain[] {
  return chains.filter((c) => !!c.isTestnet === isTestnet);
}

/** Given a chain ID, return the chain. */
export function getDAv2Chain(chainId: number): DAv2Chain {
  const ret = chains.find((c) => c.chainId === chainId);
  if (ret == null) throw new Error(`Unknown chainId ${chainId}`);
  return ret;
}

/** Returns the chain name for the given chainId. */
export function getChainName(chainId: number): string {
  return getDAv2Chain(chainId).name;
}

/** Returns the CCTP domain for the given chainId. */
export function getCctpDomain(chainId: number): number {
  return getDAv2Chain(chainId).cctpDomain;
}

/** Returns the bridge coin address for the given chainId. */
export function getBridgeCoin(chainId: number): ForeignToken {
  return getDAv2Chain(chainId).bridgeCoin;
}

/** Returns whether the chainId is a testnet. */
export function isTestnetChain(chainId: number): boolean {
  return !!getDAv2Chain(chainId).isTestnet;
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

/** Gets the display name for the given chain. */
export function getChainDisplayName(
  chain: DAv2Chain,
  short?: boolean,
  noSepolia?: boolean
): string {
  const name = short ? chain.shortName : chain.name;
  let displayName = name.charAt(0).toUpperCase() + name.slice(1);
  if (chain.isTestnet) {
    displayName = displayName.replace("Sepolia", noSepolia ? "" : " Sepolia");
  }
  return displayName;
}
