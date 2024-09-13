import { Address, getAddress, zeroAddress } from "viem";

import codegenTokens from "./codegen/tokens.json";

// All known ERC-20 tokens on supported chains.
//
// USDC token addresses taken from:
// Mainnet: https://developers.circle.com/stablecoins/docs/usdc-on-main-networks
// Testnet: https://developers.circle.com/stablecoins/docs/usdc-on-test-networks
//
// WETH reference:
// https://github.com/Uniswap/sdks/blob/main/sdks/sdk-core/src/entities/weth9.ts
//
// For all others, see the codegen.

/** Any ERC-20 token on any chain. */
export type ForeignToken = {
  chainId: number;
  token: Address;
  name?: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
};

export enum TokenLogo {
  ETH = "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
  USDC = "https://assets.coingecko.com/coins/images/6319/large/usdc.png",
  USDT = "https://assets.coingecko.com/coins/images/325/large/tether.png",
  DAI = "https://assets.coingecko.com/coins/images/9956/large/dai-multi-collateral-mcd.png",
  MATIC = "https://assets.coingecko.com/coins/images/4713/large/polygon.png",
  AVAX = "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png",
}

/* --------------------- Tokens Constants --------------------- */

//
// Eth Sepolia
//

export const ethereumSepoliaETH = nativeETH(11155111);

export const ethereumSepoliaWETH: ForeignToken = {
  chainId: 11155111,
  token: getAddress("0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9"),
  decimals: 18,
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

export const ethereumSepoliaUSDC: ForeignToken = {
  chainId: 11155111,
  token: getAddress("0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"),
  decimals: 6,
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

const ethereumSepoliaTokens = [
  ethereumSepoliaETH,
  ethereumSepoliaWETH,
  ethereumSepoliaUSDC,
];

//
// Eth Mainnet
//

export const ethereumETH = nativeETH(1);

export const ethereumWETH: ForeignToken = {
  chainId: 1,
  token: getAddress("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"),
  decimals: 18,
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

export const ethereumUSDC: ForeignToken = {
  chainId: 1,
  token: getAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"),
  decimals: 6,
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

const ethereumTokens = [ethereumETH, ethereumWETH, ethereumUSDC];

//
// Base Sepolia
//

export const baseSepoliaETH = nativeETH(84532);

export const baseSepoliaWETH: ForeignToken = {
  chainId: 84532,
  token: getAddress("0x4200000000000000000000000000000000000006"),
  decimals: 18,
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

export const baseSepoliaUSDC: ForeignToken = {
  chainId: 84532,
  token: getAddress("0x036CbD53842c5426634e7929541eC2318f3dCF7e"),
  decimals: 6,
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

const baseSepoliaTokens = [baseSepoliaETH, baseSepoliaWETH, baseSepoliaUSDC];

//
// Base Mainnet
//

export const baseETH = nativeETH(8453);

export const baseWETH: ForeignToken = {
  chainId: 8453,
  token: getAddress("0x4200000000000000000000000000000000000006"),
  decimals: 18,
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

export const baseUSDC: ForeignToken = {
  chainId: 8453,
  token: getAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"),
  symbol: "USDC",
  decimals: 6,
  logoURI: TokenLogo.USDC,
};

export const baseUSDbC: ForeignToken = {
  chainId: 8453,
  token: getAddress("0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA"),
  symbol: "USDbC",
  decimals: 6,
  logoURI: `https://daimo.com/assets/foreign-coin-logos/USDbC.png`,
};

export const baseDAI: ForeignToken = {
  chainId: 8453,
  token: getAddress("0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb"),
  symbol: "DAI",
  decimals: 18,
  logoURI: TokenLogo.DAI,
};

export const baseUSDT: ForeignToken = {
  chainId: 8453,
  token: getAddress("0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2"),
  symbol: "USDT",
  decimals: 6,
  logoURI: TokenLogo.USDT,
};

const baseTokens = [baseETH, baseWETH, baseUSDC, baseUSDbC, baseDAI, baseUSDT];

//
// Arbitrum Mainnet
//

export const arbitrumETH = nativeETH(42161);

export const arbitrumWETH: ForeignToken = {
  chainId: 42161,
  token: getAddress("0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"),
  decimals: 18,
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

export const arbitrumUSDC: ForeignToken = {
  chainId: 42161,
  token: getAddress("0xaf88d065e77c8cC2239327C5EDb3A432268e5831"),
  symbol: "USDC",
  decimals: 6,
  logoURI: TokenLogo.USDC,
};

const arbitrumTokens = [arbitrumETH, arbitrumWETH, arbitrumUSDC];

//
// Arbitrum Sepolia
//

export const arbitrumSepoliaETH = nativeETH(421614);

export const arbitrumSepoliaWETH: ForeignToken = {
  chainId: 421614,
  token: getAddress("0x980B62Da83eFf3D4576C647993b0c1D7faf17c73"),
  decimals: 18,
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

export const arbitrumSepoliaUSDC: ForeignToken = {
  chainId: 421614,
  token: getAddress("0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"),
  decimals: 6,
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

const arbitrumSepoliaTokens = [
  arbitrumSepoliaETH,
  arbitrumSepoliaWETH,
  arbitrumSepoliaUSDC,
];

//
// Optimism Mainnet
//

export const optimismETH = nativeETH(10);

export const optimismWETH: ForeignToken = {
  chainId: 10,
  token: getAddress("0x4200000000000000000000000000000000000006"),
  decimals: 18,
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

export const optimismUSDC: ForeignToken = {
  chainId: 10,
  token: getAddress("0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85"),
  decimals: 6,
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

const optimismTokens = [optimismETH, optimismWETH, optimismUSDC];

//
// Optimism Sepolia
//

export const optimismSepoliaETH = nativeETH(11155420);

export const optimismSepoliaWETH: ForeignToken = {
  chainId: 11155420,
  token: getAddress("0x4200000000000000000000000000000000000006"),
  decimals: 18,
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

export const optimismSepoliaUSDC: ForeignToken = {
  chainId: 11155420,
  token: getAddress("0x5fd84259d66Cd46123540766Be93DFE6D43130D7"),
  decimals: 6,
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

const optimismSepoliaTokens = [
  optimismSepoliaETH,
  optimismSepoliaWETH,
  optimismSepoliaUSDC,
];

//
// Polygon Mainnet
//

export const polygonMATIC = nativeToken(137, "MATIC", TokenLogo.MATIC);

export const polygonWMATIC: ForeignToken = {
  chainId: 137,
  token: getAddress("0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"),
  decimals: 18,
  symbol: "WMATIC",
  logoURI: TokenLogo.MATIC,
};

export const polygonWETH: ForeignToken = {
  chainId: 137,
  token: getAddress("0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"),
  decimals: 18,
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

export const polygonUSDC: ForeignToken = {
  chainId: 137,
  token: getAddress("0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"),
  decimals: 6,
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

const polygonTokens = [polygonMATIC, polygonWMATIC, polygonWETH, polygonUSDC];

//
// Polygon Amoy
//

export const polygonAmoyMATIC = nativeToken(80002, "MATIC", TokenLogo.MATIC);

export const polygonAmoyWMATIC: ForeignToken = {
  chainId: 80002,
  token: getAddress("0x360ad4f9a9A8EFe9A8DCB5f461c4Cc1047E1Dcf9"),
  decimals: 18,
  symbol: "WMATIC",
  logoURI: TokenLogo.MATIC,
};

export const polygonAmoyUSDC: ForeignToken = {
  chainId: 80002,
  token: getAddress("0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582"),
  decimals: 6,
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

const polygonAmoyTokens = [
  polygonAmoyMATIC,
  polygonAmoyWMATIC,
  polygonAmoyUSDC,
];

//
// Avalanche C-chain Mainnet
//

export const avalancheUSDC: ForeignToken = {
  chainId: 43114,
  token: getAddress("0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E"),
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

export const avalancheWETH: ForeignToken = {
  chainId: 43114,
  token: getAddress("0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB"), // WETH.e
  decimals: 18,
  name: "Wrapped Ether",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

export const avalancheWAVAX: ForeignToken = {
  chainId: 43114,
  token: getAddress("0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7"),
  decimals: 18,
  name: "Wrapped AVAX",
  symbol: "WAVAX",
  logoURI: TokenLogo.AVAX,
};

const avalancheTokens = [avalancheUSDC, avalancheWETH, avalancheWAVAX];

//
// Avalanche Fuji
//

export const avalancheFujiUSDC: ForeignToken = {
  chainId: 43113,
  token: getAddress("0x5425890298aed601595a70AB815c96711a31Bc65"),
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

export const avalancheFujiWAVAX: ForeignToken = {
  chainId: 43113,
  token: getAddress("0xd00ae08403B9bbb9124bB305C09058E32C39A48c"),
  decimals: 18,
  name: "Wrapped AVAX",
  symbol: "WAVAX",
  logoURI: TokenLogo.AVAX,
};

const avalancheFujiTokens = [avalancheFujiUSDC, avalancheFujiWAVAX];

function nativeETH(chainId: number) {
  return nativeToken(chainId, "ETH", TokenLogo.ETH);
}

function nativeToken(chainId: number, symbol: string, logoURI: string) {
  return {
    chainId,
    token: zeroAddress,
    decimals: 18,
    symbol,
    logoURI,
  };
}

/* --------------------- Token Utils --------------------- */

const allBasicTokens = [
  ...ethereumSepoliaTokens,
  ...ethereumTokens,
  ...baseSepoliaTokens,
  ...baseTokens,
  ...arbitrumTokens,
  ...arbitrumSepoliaTokens,
  ...optimismTokens,
  ...optimismSepoliaTokens,
  ...polygonTokens,
  ...polygonAmoyTokens,
  ...avalancheTokens,
  ...avalancheFujiTokens,
];

const toKey = (t: ForeignToken) => `${t.chainId}-${t.symbol.toLowerCase()}`;

// Export tokens for each supported chain
const tokensByChainId = new Map<number, ForeignToken[]>();
// ...add all named tokens above
for (const token of allBasicTokens) {
  const toks = tokensByChainId.get(token.chainId) || [];
  tokensByChainId.set(token.chainId, toks);
  toks.push(token);
}
// ...add all tokens codegen'd from token lists
for (const token of codegenTokens as ForeignToken[]) {
  const key = toKey(token);
  const basicToken = allBasicTokens.find((a) => toKey(a) === key);
  if (basicToken != null) {
    // This check fails, CoinGecko includes tokens such as this (symbol "ETH"):
    // https://www.coingecko.com/en/coins/the-infinite-garden
    //
    // const jsonB = toEssentialJSON(basicToken);
    // const jsonT = toEssentialJSON(token);
    // if (jsonB !== jsonT) throw new Error(`Mismatch: ${jsonB} ${jsonT}`);
    //
    // Skip token-list aliases of known, basic tokens.
    continue;
  }
  const toks = tokensByChainId.get(token.chainId) || [];
  tokensByChainId.set(token.chainId, toks);
  toks.push(token);
}

/** All known tokens on each supported chain. */
export function getTokensForChain(chainId: number): ForeignToken[] {
  const ret = tokensByChainId.get(chainId);
  if (ret == null) throw new Error(`Unsupported chain ${chainId}`);
  return ret;
}

/** Get a given token */
export function getTokenByAddress(
  chainId: number,
  addr: Address
): ForeignToken {
  const ret = getTokensForChain(chainId).find((t) => t.token === addr);
  if (ret == null) throw new Error(`Unknown token ${addr} on chain ${chainId}`);
  return ret;
}
