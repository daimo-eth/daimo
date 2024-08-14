import { Address, formatUnits, getAddress, zeroAddress } from "viem";

/**
 * USDC token addresses taken from:
 * Mainnet: https://developers.circle.com/stablecoins/docs/usdc-on-main-networks
 * Testnet: https://developers.circle.com/stablecoins/docs/usdc-on-test-networks
 */

/**
 * WETH reference:
 * https://github.com/Uniswap/sdks/blob/main/sdks/sdk-core/src/entities/weth9.ts
 */

import { amountToDollars } from "./coin";

export type ForeignToken = {
  chainId: number;
  token: Address;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
};

export enum TokenLogo {
  ETH = "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
  USDC = "https://assets.coingecko.com/coins/images/6319/large/usdc.png",
  USDT = "https://assets.coingecko.com/coins/images/325/large/tether.png?1547034089",
  DAI = "https://assets.coingecko.com/coins/images/9956/large/dai-multi-collateral-mcd.png?1574218774",
}

/* --------------------- Tokens Constants --------------------- */

//
// Eth Sepolia
//

export const ethereumSepoliaUSDC: ForeignToken = {
  chainId: 11155111,
  token: getAddress("0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"),
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

export const ethereumSepoliaTokens = [ethereumSepoliaUSDC];

//
// Eth Mainnet
//
export const ethereumUSDC: ForeignToken = {
  chainId: 1,
  token: getAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"),
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

export const ethereumTokens = [ethereumUSDC];

//
// Base Sepolia
//

export const baseSepoliaWETH: ForeignToken = {
  chainId: 84532,
  token: getAddress("0x4200000000000000000000000000000000000006"),
  decimals: 18,
  name: "Ethereum",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

export const baseSepoliaUSDC: ForeignToken = {
  chainId: 84532,
  token: getAddress("0x036CbD53842c5426634e7929541eC2318f3dCF7e"),
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

export const baseSepoliaTokens = [baseSepoliaWETH, baseSepoliaUSDC];

//
// Base Mainnet
//

export const baseWETH: ForeignToken = {
  chainId: 8453,
  token: getAddress("0x4200000000000000000000000000000000000006"),
  decimals: 18,
  name: "Ethereum",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

export const baseUSDC: ForeignToken = {
  chainId: 8453,
  token: getAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"),
  name: "USD Coin",
  symbol: "USDC",
  decimals: 6,
  logoURI: TokenLogo.USDC,
};

export const baseUSDbC: ForeignToken = {
  chainId: 8453,
  token: getAddress("0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA"),
  name: "Bridged USD Coin", // USDbC has a bad name & logo on CoinGecko
  symbol: "USDbC",
  decimals: 6,
  logoURI: `https://daimo.com/assets/foreign-coin-logos/USDbC.png`,
};

export const baseDAI: ForeignToken = {
  chainId: 8453,
  token: getAddress("0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb"),
  name: "Dai Stablecoin",
  symbol: "DAI",
  decimals: 18,
  logoURI: TokenLogo.DAI,
};

export const baseUSDT: ForeignToken = {
  chainId: 8453,
  token: getAddress("0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2"),
  name: "Tether USD",
  symbol: "USDT",
  decimals: 6,
  logoURI: TokenLogo.USDT,
};

export const baseTokens = [baseWETH, baseUSDC, baseUSDbC, baseDAI, baseUSDT];

//
// Arbitrum Mainnet
//

export const arbitrumUSDC: ForeignToken = {
  chainId: 42161,
  token: getAddress("0xaf88d065e77c8cC2239327C5EDb3A432268e5831"),
  name: "USD Coin",
  symbol: "USDC",
  decimals: 6,
  logoURI: TokenLogo.USDC,
};

export const arbitrumWETH: ForeignToken = {
  chainId: 42161,
  token: getAddress("0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"),
  decimals: 18,
  name: "Wrapped Ether",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

export const arbitrumTokens = [arbitrumUSDC, arbitrumWETH];

//
// Arbitrum Sepolia
//

export const arbitrumSepoliaUSDC: ForeignToken = {
  chainId: 421614,
  token: getAddress("0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"),
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

export const arbitrumSepoliaWETH: ForeignToken = {
  chainId: 421614,
  token: getAddress("0x980B62Da83eFf3D4576C647993b0c1D7faf17c73"),
  decimals: 18,
  name: "Wrapped Ether",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

export const arbitrumSepoliaTokens = [arbitrumSepoliaUSDC, arbitrumSepoliaWETH];

//
// Optimism Mainnet
//

export const optimismUSDC: ForeignToken = {
  chainId: 10,
  token: getAddress("0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85"),
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

export const optimismWETH: ForeignToken = {
  chainId: 10,
  token: getAddress("0x4200000000000000000000000000000000000006"),
  decimals: 18,
  name: "Wrapped Ether",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

export const optimismTokens = [optimismUSDC, optimismWETH];

//
// Optimism Sepolia
//

export const optimismSepoliaUSDC: ForeignToken = {
  chainId: 11155420,
  token: getAddress("0x5fd84259d66Cd46123540766Be93DFE6D43130D7"),
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

export const optimismSepoliaWETH: ForeignToken = {
  chainId: 11155420,
  token: getAddress("0x4200000000000000000000000000000000000006"),
  decimals: 18,
  name: "Wrapped Ether",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

export const optimismSepoliaTokens = [optimismSepoliaUSDC, optimismSepoliaWETH];

//
// Polygon Mainnet
//

export const polygonUSDC: ForeignToken = {
  chainId: 137,
  token: getAddress("0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"),
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

export const polygonWETH: ForeignToken = {
  chainId: 137,
  token: getAddress("0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"),
  decimals: 18,
  name: "Wrapped Ether",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

export const polygonTokens = [polygonUSDC, polygonWETH];

//
// Polygon Amoy
//

export const polygonAmoyUSDC: ForeignToken = {
  chainId: 80002,
  token: getAddress("0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582"),
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

export const polygonAmoyTokens = [polygonAmoyUSDC];

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

export const avalancheTokens = [avalancheUSDC, avalancheWETH];

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

export const avalancheFujiTokens = [avalancheFujiUSDC];

const chainToForeignTokens = new Map<number, ForeignToken[]>([
  [11155111, ethereumSepoliaTokens],
  [1, ethereumTokens],
  [84532, baseSepoliaTokens],
  [8453, baseTokens],
  [42161, arbitrumTokens],
  [421614, arbitrumSepoliaTokens],
  [10, optimismTokens],
  [11155420, optimismSepoliaTokens],
  [137, polygonTokens],
  [80002, polygonAmoyTokens],
  [43114, avalancheTokens],
  [43113, avalancheFujiTokens],
]);

/* --------------------- Token Utils --------------------- */

export function getForeignCoinDisplayAmount(
  amount: `${bigint}`,
  coin: ForeignToken
) {
  const amountStr = formatUnits(BigInt(amount), coin.decimals);
  const maxDecimals = 6;
  if (coin.decimals > maxDecimals) {
    return parseFloat(amountStr).toFixed(maxDecimals);
  }
  return amountStr;
}

export function getForeignCoinsByChain(chainId: number): ForeignToken[] {
  if (!chainToForeignTokens.has(chainId)) {
    throw new Error(`Invalid chainId: ${chainId}`);
  }
  return chainToForeignTokens.get(chainId) as ForeignToken[];
}

export function getForeignCoinBySymbolAndChain(
  symbol: string,
  chainId: number
): ForeignToken {
  const foreignCoins = getForeignCoinsByChain(chainId);
  if (!foreignCoins) {
    throw new Error(`Invalid chainId: ${chainId}`);
  }

  const coin = foreignCoins.find(
    (coin) => coin.symbol.toLowerCase() === symbol.toLowerCase()
  );
  if (!coin) {
    throw new Error(`Invalid coin symbol: ${symbol}`);
  }
  return coin;
}

const NON_DUST_TOKEN_WHITELIST = new Set([
  zeroAddress, // native ETH
  baseWETH.token,
  baseUSDC.token,
  baseUSDbC.token,
  baseDAI.token,
]);

// It's dust if the amount is less than $1 and the token is not on the whitelist.
export function isAmountDust(
  usdcAmount: number | bigint,
  fromCoin: ForeignToken
) {
  if (NON_DUST_TOKEN_WHITELIST.has(fromCoin.token)) return false;

  if (Number(amountToDollars(usdcAmount)) >= 1) return false;

  return true;
}

// Any coin send (stablecoins + ETH).
export const supportedSendCoins = new Map<string, ForeignToken>([
  [baseUSDC.token, baseUSDC],
  [baseDAI.token, baseDAI],
  [baseUSDT.token, baseUSDT],
  [baseWETH.token, baseWETH],
]);

// Get stable coin by address.
export function getSupportedSendCoinByAddress(
  address: string
): ForeignToken | undefined {
  return supportedSendCoins.get(address);
}
