import { WETH9 } from "@uniswap/sdk-core";
import { Address, formatUnits, getAddress } from "viem";

import { amountToDollars } from "./coin";

export type ForeignCoin = {
  token: "ETH" | Address;
  decimals: number;
  fullName: string;
  symbol: string;
  logoURI?: string; // unused?
};

export const nativeETH: ForeignCoin = {
  token: "ETH",
  decimals: 18,
  fullName: "Ethereum",
  symbol: "ETH",
  logoURI: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
};

export const daimoUSDC: ForeignCoin = {
  token: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  fullName: "USD Coin",
  symbol: "USDC",
  decimals: 6,
  logoURI: "https://assets.coingecko.com/coins/images/6319/large/usdc.png",
};

export const USDbC: ForeignCoin = {
  token: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
  fullName: "Bridged USD Coin", // USDbC has a bad name on CoinGecko
  symbol: "USDbC",
  decimals: 6,
  logoURI: `https://daimo.com/assets/foreign-coin-logos/USDbC.png`, // CoinGecko logo is fugly
};

export const DAI: ForeignCoin = {
  token: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
  fullName: "Dai Stablecoin",
  symbol: "DAI",
  decimals: 18,
  logoURI:
    "https://assets.coingecko.com/coins/images/9956/large/dai-multi-collateral-mcd.png?1574218774",
};

export const USDT: ForeignCoin = {
  token: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
  fullName: "Tether USD",
  symbol: "USDT",
  decimals: 6,
  logoURI:
    "https://assets.coingecko.com/coins/images/325/large/tether.png?1547034089",
};

export const supportedSendCoins = new Map<string, ForeignCoin>([
  [daimoUSDC.token, daimoUSDC],
  [DAI.token, DAI],
  [USDT.token, USDT],
  ["0x4200000000000000000000000000000000000006", nativeETH], // WETH
]);
export const allHomeCoins = new Map<string, ForeignCoin>([
  [daimoUSDC.token.toLowerCase(), daimoUSDC],
]);

// From https://stackoverflow.com/questions/32229667/have-max-2-decimal-places
function toFixedIfNecessary(value: string, dp: number) {
  return +parseFloat(value).toFixed(dp);
}

export function getForeignCoinDisplayAmount(
  amount: `${bigint}`,
  coin: ForeignCoin
) {
  const amountStr = formatUnits(BigInt(amount), coin.decimals);
  return toFixedIfNecessary(amountStr, 6).toString() as `${number}`;
}

const NON_DUST_TOKEN_WHITELIST = new Set([
  nativeETH.token,
  daimoUSDC.token,
  USDbC.token,
  DAI.token,
  USDT.token,
  "0x4200000000000000000000000000000000000006", // WETH
]);

// It's dust if the amount is less than $1 and the token is not on the whitelist.
export function isAmountDust(
  usdcAmount: number | bigint,
  fromCoin: ForeignCoin
) {
  if (NON_DUST_TOKEN_WHITELIST.has(fromCoin.token)) return false;

  if (Number(amountToDollars(usdcAmount)) >= 1) return false;

  return true;
}

// Get home coin by address.
export function getHomeCoinByAddress(address: Address): ForeignCoin {
  const homeCoin = allHomeCoins.get(address.toLowerCase());
  if (!homeCoin) {
    throw new Error(`getHomeCoinByAddress: ${address} is not a home coin`);
  }
  return homeCoin;
}

// Get stable coin by address.
export function getSupportedSendCoinByAddress(
  address: string
): ForeignCoin | undefined {
  return supportedSendCoins.get(address);
}

// Get WETH token addressby chainId.
export function getWETHAddressByChainId(chainId: number): Address {
  return getAddress(WETH9[chainId].address, chainId);
}
