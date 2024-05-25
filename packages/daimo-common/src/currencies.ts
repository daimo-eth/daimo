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
  ["Japanese Yen", "¥", "JPY", 0, "0xBcE206caE7f0ec07b545EddE332A47C2F75bbeb3"],
  ["Korean Won", "₩", "KRW", 0, "0x01435677FB11763550905594A16B645847C1d0F3"],
  ["Turkish Lira", "₺", "TRY", 0, "0xB09fC5fD3f11Cf9eb5E1C5Dba43114e3C9f477b5"],
  ["Swiss Franc", "₣", "CHF", 2, "0x449d117117838fFA61263B61dA6301AA2a88B13A"],
  ["Yuan", "¥", "CNY", 0, "0xeF8A4aF35cd47424672E3C590aBD37FBB7A7759a"],
  [
    "Canadian Dollar",
    "C$",
    "CAD",
    2,
    "0xa34317DB73e77d453b1B8d04550c44D10e981C8e",
  ],
  [
    "Australian Dollar",
    "A$",
    "AUD",
    2,
    "0x77F9710E7d0A19669A13c055F62cd80d313dF022",
  ],
  [
    "Singapore Dollar",
    "S$",
    "SGD",
    2,
    "0xe25277fF4bbF9081C75Ab0EB13B4A13a721f3E13",
  ],
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
