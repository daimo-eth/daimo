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

const data: [string, string, string, number][] = [
  ["Euro", "€", "EUR", 2],
  ["Thai Baht", "฿", "THB", 2],
  ["Argentine Peso", "ARS", "ARS", 0],
  ["Bolivian Boliviano", "$Bs", "BOB", 0],
  ["Turkish Lira", "₺", "TRY", 0],
  ["New Taiwan Dollar", "NT$", "TWD", 0],
  ["Ukrainian Hryvnia", "₴", "UAH", 0],
  ["Naira", "₦", "NGN", 0],
  ["Swiss Franc", "₣", "CHF", 2],
  ["Japanese Yen", "¥", "JPY", 0],
  ["Korean Won", "₩", "KRW", 0],
  ["Yuan", "¥", "CNY", 0],
  ["Pound", "£", "GBP", 2],
  ["Canadian Dollar", "C$", "CAD", 2],
  ["Australian Dollar", "A$", "AUD", 2],
  ["Singapore Dollar", "S$", "SGD", 2],
];

export const nonUsdCurrencies = data.map(
  ([name, symbol, currency, decimals]) => ({
    name,
    symbol,
    currency,
    decimals,
  })
);
