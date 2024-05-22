import { CurrencyExchangeRate, currencyRateUSD } from "@daimo/common";

export interface LocalMoneyEntry {
  currency: CurrencyExchangeRate;
  localUnits: number;
}

export interface MoneyEntry extends LocalMoneyEntry {
  dollars: number;
}

export const zeroUSDEntry = {
  currency: currencyRateUSD,
  localUnits: 0,
  dollars: 0,
};

export function usdEntry(dollars: number | `${number}`): MoneyEntry {
  const n = typeof dollars === "number" ? dollars : parseFloat(dollars);
  return {
    currency: currencyRateUSD,
    localUnits: n,
    dollars: n,
  };
}
