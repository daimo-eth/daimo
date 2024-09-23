import { CurrencyExchangeRate, currencyRateUSD } from "./currencies";

// Represents a user-entered amount in local currency, eg "¥100"
export interface LocalMoneyEntry {
  currency: CurrencyExchangeRate;
  localUnits: number;
}

// Represents a user-entered mmount in local currency, plus the equivalent in
// USD at current exchange rate. eg "¥100 = $1.07"
export interface MoneyEntry extends LocalMoneyEntry {
  dollars: number;
}

// Special case: a user-entered amount in dollars, no conversion needed.
export function usdEntry(dollars: number | `${number}`): MoneyEntry {
  const n = typeof dollars === "number" ? dollars : parseFloat(dollars);
  return {
    currency: currencyRateUSD,
    localUnits: n,
    dollars: n,
  };
}

// Special case: $0.00
export const zeroUSDEntry = usdEntry(0);
