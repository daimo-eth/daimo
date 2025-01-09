/**
 * All chains that DAv2 supports (e.g. send to any chain).
 *
 * Each chain must also support CCTP:
 * https://developers.circle.com/stablecoins/docs/supported-domains
 */

import { bsc as bscViem } from "viem/chains";

import { DaimoChain } from "./chainConfig";
import {
  ForeignToken,
  arbitrumETH,
  arbitrumSepoliaETH,
  arbitrumSepoliaUSDC,
  arbitrumSepoliaWETH,
  arbitrumUSDC,
  arbitrumWETH,
  avalancheAVAX,
  avalancheFujiAVAX,
  avalancheFujiUSDC,
  avalancheFujiWAVAX,
  avalancheUSDC,
  avalancheWAVAX,
  baseETH,
  baseSepoliaETH,
  baseSepoliaUSDC,
  baseSepoliaWETH,
  baseUSDC,
  baseWETH,
  blastETH,
  blastUSDB,
  blastWETH,
  bscAxlUSDC,
  bscBNB,
  bscUSDC,
  bscWBNB,
  ethereumETH,
  ethereumSepoliaETH,
  ethereumSepoliaUSDC,
  ethereumSepoliaWETH,
  ethereumUSDC,
  ethereumWETH,
  lineaBridgedUSDC,
  lineaETH,
  lineaWETH,
  optimismETH,
  optimismSepoliaETH,
  optimismSepoliaUSDC,
  optimismSepoliaWETH,
  optimismUSDC,
  optimismWETH,
  polygonAmoyMATIC,
  polygonAmoyUSDC,
  polygonAmoyWMATIC,
  polygonMATIC,
  polygonUSDC,
  polygonWMATIC,
  solanaNativeSol,
  solanaUSDC,
  solanaWrappedSOL,
  worldchainETH,
  worldchainUSDCe,
  worldchainWETH,
} from "./foreignToken";

/** An EVM chain supported by DaimoAccountV2. */
export type DAv2Chain = {
  chainId: number;
  name: string;
  shortName: string;
  cctpDomain: number;
  bridgeCoin: ForeignToken;
  /**
   * The USDC token to use for quoting / pricing other tokens on this chain.
   *
   * TODO: this is not always USDC. Rename to localUSDToken
   */
  localUSDC: ForeignToken;
  nativeToken: ForeignToken;
  wrappedNativeToken: ForeignToken;
  isTestnet?: boolean;
};

/**
 * Returns whether a given chainID is an EVM chain.
 * TODO: move Solana etc to their own ID space.
 */
export function isEvmChain(chainId: number) {
  return chainId !== solana.chainId;
}

export const ethereum: DAv2Chain = {
  chainId: 1,
  name: "ethereum",
  shortName: "eth",
  cctpDomain: 0,
  bridgeCoin: ethereumUSDC,
  localUSDC: ethereumUSDC,
  nativeToken: ethereumETH,
  wrappedNativeToken: ethereumWETH,
};

export const ethereumSepolia: DAv2Chain = {
  chainId: 11155111,
  name: "ethereumSepolia",
  shortName: "eth",
  cctpDomain: 0,
  bridgeCoin: ethereumSepoliaUSDC,
  localUSDC: ethereumSepoliaUSDC,
  nativeToken: ethereumSepoliaETH,
  wrappedNativeToken: ethereumSepoliaWETH,
  isTestnet: true,
};

export const base: DAv2Chain = {
  chainId: 8453,
  name: "base",
  shortName: "base",
  cctpDomain: 6,
  bridgeCoin: baseUSDC,
  localUSDC: baseUSDC,
  nativeToken: baseETH,
  wrappedNativeToken: baseWETH,
};

export const baseSepolia: DAv2Chain = {
  chainId: 84532,
  name: "baseSepolia",
  shortName: "base",
  cctpDomain: 6,
  bridgeCoin: baseSepoliaUSDC,
  localUSDC: baseSepoliaUSDC,
  nativeToken: baseSepoliaETH,
  wrappedNativeToken: baseSepoliaWETH,
  isTestnet: true,
};

export const arbitrum: DAv2Chain = {
  chainId: 42161,
  name: "arbitrum",
  shortName: "arb",
  cctpDomain: 3,
  bridgeCoin: arbitrumUSDC,
  localUSDC: arbitrumUSDC,
  nativeToken: arbitrumETH,
  wrappedNativeToken: arbitrumWETH,
};

export const arbitrumSepolia: DAv2Chain = {
  chainId: 421614,
  name: "arbitrumSepolia",
  shortName: "arb",
  cctpDomain: 3,
  bridgeCoin: arbitrumSepoliaUSDC,
  localUSDC: arbitrumSepoliaUSDC,
  nativeToken: arbitrumSepoliaETH,
  wrappedNativeToken: arbitrumSepoliaWETH,
  isTestnet: true,
};

export const optimism: DAv2Chain = {
  chainId: 10,
  name: "optimism",
  shortName: "op",
  cctpDomain: 2,
  bridgeCoin: optimismUSDC,
  localUSDC: optimismUSDC,
  nativeToken: optimismETH,
  wrappedNativeToken: optimismWETH,
};

export const optimismSepolia: DAv2Chain = {
  chainId: 11155420,
  name: "optimismSepolia",
  shortName: "op",
  cctpDomain: 2,
  bridgeCoin: optimismSepoliaUSDC,
  localUSDC: optimismSepoliaUSDC,
  nativeToken: optimismSepoliaETH,
  wrappedNativeToken: optimismSepoliaWETH,
  isTestnet: true,
};

export const polygon: DAv2Chain = {
  chainId: 137,
  name: "polygon",
  shortName: "poly",
  cctpDomain: 7,
  bridgeCoin: polygonUSDC,
  localUSDC: polygonUSDC,
  nativeToken: polygonMATIC,
  wrappedNativeToken: polygonWMATIC,
};

export const polygonAmoy: DAv2Chain = {
  chainId: 80002,
  name: "polygonAmoy",
  shortName: "poly",
  cctpDomain: 7,
  bridgeCoin: polygonAmoyUSDC,
  localUSDC: polygonAmoyUSDC,
  nativeToken: polygonAmoyMATIC,
  wrappedNativeToken: polygonAmoyWMATIC,
  isTestnet: true,
};

export const avalanche: DAv2Chain = {
  chainId: 43114,
  name: "avalanche",
  shortName: "avax",
  cctpDomain: 1,
  bridgeCoin: avalancheUSDC,
  localUSDC: avalancheUSDC,
  nativeToken: avalancheAVAX,
  wrappedNativeToken: avalancheWAVAX,
};

export const avalancheFuji: DAv2Chain = {
  chainId: 43113,
  name: "avalancheFuji",
  shortName: "avax",
  cctpDomain: 1,
  bridgeCoin: avalancheFujiUSDC,
  localUSDC: avalancheFujiUSDC,
  nativeToken: avalancheFujiAVAX,
  wrappedNativeToken: avalancheFujiWAVAX,
  isTestnet: true,
};

export const linea: DAv2Chain = {
  chainId: 59144,
  name: "linea",
  shortName: "linea",
  cctpDomain: -1,
  bridgeCoin: lineaBridgedUSDC,
  localUSDC: lineaBridgedUSDC,
  nativeToken: lineaETH,
  wrappedNativeToken: lineaWETH,
};

export const bsc: DAv2Chain = {
  chainId: bscViem.id,
  name: bscViem.name,
  shortName: "bsc",
  cctpDomain: -1,
  bridgeCoin: bscAxlUSDC,
  localUSDC: bscUSDC,
  nativeToken: bscBNB,
  wrappedNativeToken: bscWBNB,
};

export const solana: DAv2Chain = {
  chainId: 501,
  name: "solana",
  shortName: "sol",
  cctpDomain: 5,
  bridgeCoin: solanaUSDC,
  localUSDC: solanaUSDC,
  nativeToken: solanaNativeSol,
  wrappedNativeToken: solanaWrappedSOL,
};

export const worldchain: DAv2Chain = {
  chainId: 480,
  name: "worldchain",
  shortName: "world",
  cctpDomain: -1,
  bridgeCoin: worldchainUSDCe,
  localUSDC: worldchainUSDCe,
  nativeToken: worldchainETH,
  wrappedNativeToken: worldchainWETH,
};

export const blast: DAv2Chain = {
  chainId: 81457,
  name: "blast",
  shortName: "blast",
  cctpDomain: -1,
  bridgeCoin: blastWETH,
  localUSDC: blastUSDB, // Blast doesn't have local USDC
  nativeToken: blastETH,
  wrappedNativeToken: blastWETH,
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
  linea,
  bsc,
  solana,
  worldchain,
  blast,
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
export function getCCTPDomain(chainId: number): number {
  return getDAv2Chain(chainId).cctpDomain;
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
  noSepolia?: boolean,
): string {
  const name = short ? chain.shortName : chain.name;
  let displayName = name.charAt(0).toUpperCase() + name.slice(1);
  if (chain.isTestnet) {
    displayName = displayName.replace("Sepolia", noSepolia ? "" : " Sepolia");
  }
  return displayName;
}

/** Returns the native token for the given chain. */
export function getChainNativeToken(chainId: number): ForeignToken {
  return getDAv2Chain(chainId).nativeToken;
}
