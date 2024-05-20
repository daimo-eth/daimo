import { Address } from "viem";

const data: [string, string, Address][] = [
  ["€", "EUR", "0xb49f677943BC038e9857d61E7d053CaA2C1734C1"],
  ["£", "GBP", "0x5c0Ab2d9b5a7ed9f470386e82BB36A3613cDd4b5"],
  ["¥", "JPY", "0xBcE206caE7f0ec07b545EddE332A47C2F75bbeb3"],
  ["₩", "KRW", "0x01435677FB11763550905594A16B645847C1d0F3"],
  ["₺", "TRY", "0xB09fC5fD3f11Cf9eb5E1C5Dba43114e3C9f477b5"],
  ["₣", "CHF", "0x449d117117838fFA61263B61dA6301AA2a88B13A"],
];

export interface CurrencyExchangeRate {
  symbol: string;
  currency: string;
  rateUSD: number;
}

export const daimoCurrencies = data.map(([symbol, currency, address]) => ({
  symbol,
  currency,
  usdPair: `${currency}USD`,
  usdPairChainlinkAddress: address,
}));
