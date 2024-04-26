import { Address, formatUnits } from "viem";

export type ForeignCoin = {
  token: "ETH" | Address;
  decimals: number;
  fullName: string;
  symbol: string;
  logoURI?: string;
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
