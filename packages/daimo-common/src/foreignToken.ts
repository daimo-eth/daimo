import { Address, formatUnits, zeroAddress } from "viem";

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
// Base Sepolia
//

export const baseSepoliaWETH: ForeignToken = {
  chainId: 84532,
  token: "0x4200000000000000000000000000000000000006",
  decimals: 18,
  name: "Ethereum",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

export const baseSepoliaUSDC: ForeignToken = {
  chainId: 84532,
  token: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

//
// Base Mainnet
//

export const baseWETH: ForeignToken = {
  chainId: 8453,
  token: "0x4200000000000000000000000000000000000006",
  decimals: 18,
  name: "Ethereum",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

export const baseUSDC: ForeignToken = {
  chainId: 8453,
  token: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  name: "USD Coin",
  symbol: "USDC",
  decimals: 6,
  logoURI: TokenLogo.USDC,
};

export const baseUSDbC: ForeignToken = {
  chainId: 8453,
  token: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
  name: "Bridged USD Coin", // USDbC has a bad name & logo on CoinGecko
  symbol: "USDbC",
  decimals: 6,
  logoURI: `https://daimo.com/assets/foreign-coin-logos/USDbC.png`,
};

export const baseDAI: ForeignToken = {
  chainId: 8453,
  token: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
  name: "Dai Stablecoin",
  symbol: "DAI",
  decimals: 18,
  logoURI: TokenLogo.DAI,
};

export const baseUSDT: ForeignToken = {
  chainId: 8453,
  token: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
  name: "Tether USD",
  symbol: "USDT",
  decimals: 6,
  logoURI: TokenLogo.USDT,
};

//
// Arbitrum Mainnet
//

export const arbitrumUSDC: ForeignToken = {
  chainId: 42161,
  token: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  name: "USD Coin",
  symbol: "USDC",
  decimals: 6,
  logoURI: TokenLogo.USDC,
};

export const arbitrumWETH: ForeignToken = {
  chainId: 42161,
  token: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
  decimals: 18,
  name: "Wrapped Ether",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

//
// Arbitrum Sepolia
//

export const arbitrumSepoliaUSDC: ForeignToken = {
  chainId: 421614,
  token: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

export const arbitrumSepoliaWETH: ForeignToken = {
  chainId: 421614,
  token: "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73",
  decimals: 18,
  name: "Wrapped Ether",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

//
// Optimism Mainnet
//

export const optimismUSDC: ForeignToken = {
  chainId: 10,
  token: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

export const optimismWETH: ForeignToken = {
  chainId: 10,
  token: "0x4200000000000000000000000000000000000006",
  decimals: 18,
  name: "Wrapped Ether",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

//
// Optimism Sepolia
//

export const optimismSepoliaUSDC: ForeignToken = {
  chainId: 11155420,
  token: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

export const optimismSepoliaWETH: ForeignToken = {
  chainId: 11155420,
  token: "0x4200000000000000000000000000000000000006",
  decimals: 18,
  name: "Wrapped Ether",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

//
// Polygon Mainnet
//

export const polygonUSDC: ForeignToken = {
  chainId: 137,
  token: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

export const polygonWETH: ForeignToken = {
  chainId: 137,
  token: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
  decimals: 18,
  name: "Wrapped Ether",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

//
// Polygon Sepolia
//

export const polygonAmoyUSDC: ForeignToken = {
  chainId: 80002,
  token: "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582",
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

//
// Avalanche C-chain Mainnet
//

export const avalancheUSDC: ForeignToken = {
  chainId: 43114,
  token: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

export const avalancheWETH: ForeignToken = {
  chainId: 43114,
  token: "0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab", // WETH.e
  decimals: 18,
  name: "Wrapped Ether",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
};

//
// Avalanche Fuji
//

export const avalancheFujiUSDC: ForeignToken = {
  chainId: 43113,
  token: "0x5425890298aed601595a70ab815c96711a31bc65",
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
};

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
