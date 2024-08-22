/**
 * All chains that support a Daimo account.
 *
 * Each chain must also support CCTP:
 * https://developers.circle.com/stablecoins/docs/supported-domains
 */

import {
  ChainConfig,
  DaimoChain,
  ForeignToken,
  TokenLogo,
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
} from "@daimo/contract";
import { zeroAddress } from "viem";

/** An EVM chain supported by DaimoAccountV2. */
export type AccountChain = {
  chainId: number;
  name: string;
  cctpDomain: number;
  bridgeCoin: ForeignToken;
  wrappedNativeToken: ForeignToken;
  isTestnet?: boolean;
};

export const ethereum: AccountChain = {
  chainId: 1,
  name: "mainnet",
  cctpDomain: 0,
  bridgeCoin: ethereumUSDC,
  wrappedNativeToken: ethereumWETH,
};

export const ethereumSepolia: AccountChain = {
  chainId: 11155111,
  name: "sepolia",
  cctpDomain: 0,
  bridgeCoin: ethereumSepoliaUSDC,
  wrappedNativeToken: ethereumSepoliaWETH,
  isTestnet: true,
};

export const base: AccountChain = {
  chainId: 8453,
  name: "base",
  cctpDomain: 6,
  bridgeCoin: baseUSDC,
  wrappedNativeToken: baseWETH,
};

export const baseSepolia: AccountChain = {
  chainId: 84532,
  name: "baseSepolia",
  cctpDomain: 6,
  bridgeCoin: baseSepoliaUSDC,
  wrappedNativeToken: baseSepoliaWETH,
  isTestnet: true,
};

export const arbitrum: AccountChain = {
  chainId: 42161,
  name: "arbitrum",
  cctpDomain: 3,
  bridgeCoin: arbitrumUSDC,
  wrappedNativeToken: arbitrumWETH,
};

export const arbitrumSepolia: AccountChain = {
  chainId: 421614,
  name: "arbitrumSepolia",
  cctpDomain: 3,
  bridgeCoin: arbitrumSepoliaUSDC,
  wrappedNativeToken: arbitrumSepoliaWETH,
  isTestnet: true,
};

export const optimism: AccountChain = {
  chainId: 10,
  name: "optimism",
  cctpDomain: 2,
  bridgeCoin: optimismUSDC,
  wrappedNativeToken: optimismWETH,
};

export const optimismSepolia: AccountChain = {
  chainId: 11155420,
  name: "optimismSepolia",
  cctpDomain: 2,
  bridgeCoin: optimismSepoliaUSDC,
  wrappedNativeToken: optimismSepoliaWETH,
  isTestnet: true,
};

export const polygon: AccountChain = {
  chainId: 137,
  name: "polygon",
  cctpDomain: 7,
  bridgeCoin: polygonUSDC,
  wrappedNativeToken: polygonWMATIC,
};

export const polygonAmoy: AccountChain = {
  chainId: 80002,
  name: "polygonAmoy",
  cctpDomain: 7,
  bridgeCoin: polygonAmoyUSDC,
  wrappedNativeToken: polygonAmoyWMATIC,
  isTestnet: true,
};

export const avalanche: AccountChain = {
  chainId: 43114,
  name: "avalanche",
  cctpDomain: 1,
  bridgeCoin: avalancheUSDC,
  wrappedNativeToken: avalancheWAVAX,
};

export const avalancheFuji: AccountChain = {
  chainId: 43113,
  name: "avalancheFuji",
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

/** Given a chain ID, return the chain. */
export function getAccountChain(chainId: number): AccountChain {
  const ret = chains.find((c) => c.chainId === chainId);
  if (ret == null) throw new Error(`Unknown chainId ${chainId}`);
  return ret;
}

/** Returns the chain name for the given chainId. */
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
  return !!getAccountChain(chainId).isTestnet;
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
        logoURI: TokenLogo.ETH,
        chainId,
      };
    default:
      // Some chains, like Polygon PoS, don't have native ETH.
      return undefined;
  }
}
