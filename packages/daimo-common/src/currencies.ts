import { Address } from "viem";

export interface CurrencyExchangeRate {
  name: string;
  symbol: string;
  currency: string;
  decimals: number;
  rateUSD: number;
}

export const currencyRateUSD: CurrencyExchangeRate = {
  name: "US Dollar",
  symbol: "$",
  currency: "USD",
  decimals: 2,
  rateUSD: 1,
};

const data: [string, string, string, number, Address][] = [
  ["Euro", "€", "EUR", 2, "0xb49f677943BC038e9857d61E7d053CaA2C1734C1"],
  ["Pound", "£", "GBP", 2, "0x5c0Ab2d9b5a7ed9f470386e82BB36A3613cDd4b5"],
  ["Japnese Yen", "¥", "JPY", 0, "0xBcE206caE7f0ec07b545EddE332A47C2F75bbeb3"],
  ["Korean Won", "₩", "KRW", 0, "0x01435677FB11763550905594A16B645847C1d0F3"],
  ["Turkish Lira", "₺", "TRY", 0, "0xB09fC5fD3f11Cf9eb5E1C5Dba43114e3C9f477b5"],
  ["Swiss Franc", "₣", "CHF", 2, "0x449d117117838fFA61263B61dA6301AA2a88B13A"],
];

export const nonUsdCurrencies = data.map(
  ([name, symbol, currency, decimals, address]) => ({
    name,
    symbol,
    currency,
    decimals,
    usdPair: `${currency}USD`,
    usdPairChainlinkAddress: address,
  })
);
