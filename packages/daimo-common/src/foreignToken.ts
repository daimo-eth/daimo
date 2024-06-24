import { ChainConfig } from "@daimo/contract";
import { Address, formatUnits } from "viem";

import { base, baseSepolia } from "./chain";
import { amountToDollars } from "./coin";

export type ForeignToken = {
  chainId: number;
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
};

//
// Base Sepolia
//

export const baseSepoliaWETH: ForeignToken = {
  address: "0x4200000000000000000000000000000000000006",
  decimals: 18,
  name: "Ethereum",
  symbol: "WETH",
  logoURI: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
  chainId: 84532,
};

//
// Base Mainnet
//

// TODO: 0x0 sentinel value for actual native ETH vs rollup-native WETH?

export const baseWETH: ForeignToken = {
  address: "0x4200000000000000000000000000000000000006",
  decimals: 18,
  name: "Ethereum",
  symbol: "WETH",
  logoURI: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
  chainId: 8453,
};

export const baseUSDC: ForeignToken = {
  address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  name: "USD Coin",
  symbol: "USDC",
  decimals: 6,
  logoURI: "https://assets.coingecko.com/coins/images/6319/large/usdc.png",
  chainId: 8453,
};

export const baseUSDbC: ForeignToken = {
  address: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
  name: "Bridged USD Coin", // USDbC has a bad name on CoinGecko
  symbol: "USDbC",
  decimals: 6,
  logoURI: `https://daimo.com/assets/foreign-coin-logos/USDbC.png`, // CoinGecko logo is fugly
  chainId: 8453,
};

export const baseDAI: ForeignToken = {
  address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
  name: "Dai Stablecoin",
  symbol: "DAI",
  decimals: 18,
  logoURI:
    "https://assets.coingecko.com/coins/images/9956/large/dai-multi-collateral-mcd.png?1574218774",
  chainId: 8453,
};

export const baseUSDT: ForeignToken = {
  address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
  name: "Tether USD",
  symbol: "USDT",
  decimals: 6,
  logoURI:
    "https://assets.coingecko.com/coins/images/325/large/tether.png?1547034089",
  chainId: 8453,
};

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
  return token.chainId === chainId && token.symbol === "ETH";
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
