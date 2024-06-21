import { ChainConfig } from "@daimo/contract";
import { WETH9 } from "@uniswap/sdk-core";
import { Address, formatUnits, getAddress } from "viem";

import { amountToDollars } from "./coin";

export type ForeignToken = {
  chainId: number;
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
};

export const baseETH: ForeignToken = {
  address: "0x4200000000000000000000000000000000000006",
  decimals: 18,
  name: "Ethereum",
  symbol: "ETH",
  logoURI: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
  chainId: 8453,
};

export const daimoUSDC: ForeignToken = {
  address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  name: "USD Coin",
  symbol: "USDC",
  decimals: 6,
  logoURI: "https://assets.coingecko.com/coins/images/6319/large/usdc.png",
  chainId: 8453,
};

export const USDbC: ForeignToken = {
  address: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
  name: "Bridged USD Coin", // USDbC has a bad name on CoinGecko
  symbol: "USDbC",
  decimals: 6,
  logoURI: `https://daimo.com/assets/foreign-coin-logos/USDbC.png`, // CoinGecko logo is fugly
  chainId: 8453,
};

export const DAI: ForeignToken = {
  address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
  name: "Dai Stablecoin",
  symbol: "DAI",
  decimals: 18,
  logoURI:
    "https://assets.coingecko.com/coins/images/9956/large/dai-multi-collateral-mcd.png?1574218774",
  chainId: 8453,
};

// From https://stackoverflow.com/questions/32229667/have-max-2-decimal-places
function toFixedIfNecessary(value: string, dp: number) {
  return +parseFloat(value).toFixed(dp);
}

export function getForeignCoinDisplayAmount(
  amount: `${bigint}`,
  coin: ForeignToken
) {
  const amountStr = formatUnits(BigInt(amount), coin.decimals);
  return toFixedIfNecessary(amountStr, 6).toString() as `${number}`;
}

const NON_DUST_TOKEN_WHITELIST = new Set([
  baseETH.address,
  daimoUSDC.address,
  USDbC.address,
  DAI.address,
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

// Get WETH token address using chainId.
export function getWETHAddressByChainId(chainId: number): Address {
  return getAddress(WETH9[chainId].address, chainId);
}

// Token is native ETH to the given chainConfig.
export function isNativeETH(
  tokenAddress: Address,
  chain: ChainConfig | number
): boolean {
  const tokenAddr = getAddress(tokenAddress);
  let isNative = false;
  if (typeof chain === "number") {
    isNative = getWETHAddressByChainId(chain) === tokenAddr;
  } else {
    isNative = getWETHAddressByChainId(chain.chainL2.id) === tokenAddr;
  }
  return isNative;
}
