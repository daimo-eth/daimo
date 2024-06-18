import { CurrencyExchangeRate, assert, nonUsdCurrencies } from "@daimo/common";

import { ExternalApiCache } from "../db/externalApiCache";
import { getEnvApi } from "../env";
import { fetchWithBackoff } from "../network/fetchWithBackoff";
import { retryBackoff } from "../utils/retryBackoff";

let promise: Promise<CurrencyExchangeRate[]> | null = null;

export async function getExchangeRates(extApiCache: ExternalApiCache) {
  // If concurrent users want exchange rates, only fetch once.
  if (promise == null) {
    promise = getExchangeRatesInner(extApiCache);
  }
  const ret = await promise;
  promise = null;
  return ret;
}

export async function getExchangeRatesInner(extApiCache: ExternalApiCache) {
  const json = await retryBackoff("fetchExchangeRates", () =>
    extApiCache.get("exchange-rates", "rates", fetchExchangeRates, 3600)
  );

  assert(!!json, "No exchange rates found");
  const data = JSON.parse(json);
  assert(data.base === "USD", "Exchange rates must be in USD");

  const ret = nonUsdCurrencies.map((c) => {
    const { name, symbol, currency, decimals } = c;
    const rateUSD = 1 / Number(data.rates[c.currency]);
    assert(rateUSD > 0, `Exchange rate invalid: ${c.currency} ${rateUSD}`);
    return { name, symbol, currency, decimals, rateUSD };
  });

  return ret;
}

async function fetchExchangeRates() {
  // Fetch JSON from EXCHANGE_RATES_URL using fetch()
  const ratesUrl = getEnvApi().EXCHANGE_RATES_URL;
  console.log(`[API] fetching exchange rates from ${ratesUrl}`);
  const res = await fetchWithBackoff(new URL(ratesUrl));
  if (!res.ok) {
    throw new Error(`Failed to fetch exchange rates: ${res.statusText}`);
  }
  const retObj = await res.json();
  const retStr = JSON.stringify(retObj);
  console.log(`[API] got currency exchange rates: ${retStr}`);
  return retStr;
}
