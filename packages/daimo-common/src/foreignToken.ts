import { ChainConfig } from "@daimo/contract";
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

import {
  arbitrum,
  arbitrumSepolia,
  avalanche,
  avalancheFuji,
  optimism,
  optimismSepolia,
  polygon,
  polygonAmoy,
  base,
  baseSepolia,
} from "./chain";
import { amountToDollars } from "./coin";

export type ForeignToken = {
  chainId: number;
  address: Address;
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
  address: zeroAddress,
  decimals: 18,
  name: "Ethereum",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
  chainId: baseSepolia.chainId,
};

export const baseSepoliaUSDC: ForeignToken = {
  address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
  chainId: baseSepolia.chainId,
};

export const baseSepoliaETH: ForeignToken = {
  address: "0x0000000000000000000000000000000000000000",
  decimals: 18,
  name: "Ethereum",
  symbol: "ETH",
  logoURI: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
  chainId: 84532,
};

//
// Base Mainnet
//

export const baseETH: ForeignToken = {
  address: zeroAddress,
  decimals: 18,
  name: "Ethereum",
  symbol: "ETH",
  logoURI: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
  chainId: 8453,
};

export const baseWETH: ForeignToken = {
  address: "0x4200000000000000000000000000000000000006",
  decimals: 18,
  name: "Ethereum",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
  chainId: base.chainId,
};

export const baseUSDC: ForeignToken = {
  address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  name: "USD Coin",
  symbol: "USDC",
  decimals: 6,
  logoURI: TokenLogo.USDC,
  chainId: base.chainId,
};

export const baseUSDbC: ForeignToken = {
  address: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
  name: "Bridged USD Coin", // USDbC has a bad name on CoinGecko
  symbol: "USDbC",
  decimals: 6,
  logoURI: `https://daimo.com/assets/foreign-coin-logos/USDbC.png`, // CoinGecko logo is fugly
  chainId: base.chainId,
};

export const baseDAI: ForeignToken = {
  address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
  name: "Dai Stablecoin",
  symbol: "DAI",
  decimals: 18,
  logoURI: TokenLogo.DAI,
  chainId: base.chainId,
};

export const baseUSDT: ForeignToken = {
  address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
  name: "Tether USD",
  symbol: "USDT",
  decimals: 6,
  logoURI: TokenLogo.USDT,
  chainId: base.chainId,
};

//
// Arbitrum Mainnet
//

export const arbitrumUSDC: ForeignToken = {
  address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  name: "USD Coin",
  symbol: "USDC",
  decimals: 6,
  logoURI: TokenLogo.USDC,
  chainId: arbitrum.chainId,
};

export const arbitrumWETH: ForeignToken = {
  address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
  decimals: 18,
  name: "Wrapped Ether",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
  chainId: arbitrum.chainId,
};

//
// Arbitrum Sepolia
//

export const arbitrumSepoliaUSDC: ForeignToken = {
  address: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
  chainId: arbitrumSepolia.chainId,
};

export const arbitrumSepoliaWETH: ForeignToken = {
  address: "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73",
  decimals: 18,
  name: "Wrapped Ether",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
  chainId: arbitrumSepolia.chainId,
};

//
// Optimism Mainnet
//

export const optimismUSDC: ForeignToken = {
  address: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
  chainId: optimism.chainId,
};

export const optimismWETH: ForeignToken = {
  address: "0x4200000000000000000000000000000000000006",
  decimals: 18,
  name: "Wrapped Ether",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
  chainId: optimism.chainId,
};

//
// Optimism Sepolia
//

export const optimismSepoliaUSDC: ForeignToken = {
  address: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
  chainId: optimismSepolia.chainId,
};

export const optimismSepoliaWETH: ForeignToken = {
  address: "0x4200000000000000000000000000000000000006",
  decimals: 18,
  name: "Wrapped Ether",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
  chainId: optimismSepolia.chainId,
};

//
// Polygon Mainnet
//

export const polygonUSDC: ForeignToken = {
  address: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
  chainId: polygon.chainId,
};

export const polygonWETH: ForeignToken = {
  address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
  decimals: 18,
  name: "Wrapped Ether",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
  chainId: polygon.chainId,
};

//
// Polygon Sepolia
//

export const polygonSepoliaUSDC: ForeignToken = {
  address: "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582",
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
  chainId: polygonAmoy.chainId,
};

//
// Avalanche C-chain Mainnet
//

export const avalancheUSDC: ForeignToken = {
  address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
  chainId: avalanche.chainId,
};

export const avalancheWETH: ForeignToken = {
  address: "0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab", // WETH.e
  decimals: 18,
  name: "Wrapped Ether",
  symbol: "WETH",
  logoURI: TokenLogo.ETH,
  chainId: avalanche.chainId,
};

//
// Avalanche Sepolia
//

export const avalancheFujiUSDC: ForeignToken = {
  address: "0x5425890298aed601595a70ab815c96711a31bc65",
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: TokenLogo.USDC,
  chainId: avalancheFuji.chainId,
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
  baseETH.address,
  baseWETH.address,
  baseUSDC.address,
  baseUSDbC.address,
  baseDAI.address,
]);

// It's dust if the amount is less than $1 and the token is not on the whitelist.
export function isAmountDust(
  usdcAmount: number | bigint,
  fromCoin: ForeignToken
) {
  if (NON_DUST_TOKEN_WHITELIST.has(fromCoin.address)) return false;

  if (Number(amountToDollars(usdcAmount)) >= 1) return false;

  return true;
}

// Get native WETH token address using chainId.
export function getNativeWETHByChain(
  chainId: number
): ForeignToken | undefined {
  switch (chainId) {
    case base.chainId:
      return base.nativeWETH;
    case baseSepolia.chainId:
      return baseSepolia.nativeWETH;
  }
}

// Checks if the token ETH or native WETH on the given chain.
export function isNativeETH(
  token: ForeignToken,
  chain: ChainConfig | number
): boolean {
  const chainId = typeof chain === "number" ? chain : chain.chainL2.id;
  return token.chainId === chainId && token.address === zeroAddress;
}

// Any coin send (stablecoins + ETH).
export const supportedSendCoins = new Map<string, ForeignToken>([
  [baseUSDC.address, baseUSDC],
  [baseDAI.address, baseDAI],
  [baseUSDT.address, baseUSDT],
  [baseWETH.address, baseWETH],
]);

// Get stable coin by address.
export function getSupportedSendCoinByAddress(
  address: string
): ForeignToken | undefined {
  return supportedSendCoins.get(address);
}
