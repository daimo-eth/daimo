import {
  CurrencyExchangeRate,
  assert,
  getEnv,
  nonUsdCurrencies,
  now,
} from "@daimo/common";

import { ViemClient } from "../network/viemClient";
import { retryBackoff } from "../utils/retryBackoff";

const exchangeRatesUrl = getEnv("EXCHANGE_RATES_URL");

export async function getExchangeRates(vc: ViemClient) {
  const data = await retryBackoff("fetchExchangeRates", async () => {
    // Fetch JSON from EXCHANGE_RATES_URL using fetch()
    console.log(`[API] fetching exchange rates from ${exchangeRatesUrl}`);
    const res = await fetch(new URL(exchangeRatesUrl));
    if (!res.ok) {
      throw new Error(`Failed to fetch exchange rates: ${res.statusText}`);
    }
    return await res.json();
  });
  console.log(`[API] got currency exchange rates: ${JSON.stringify(data)}`);

  assert(data != null, "No exchange rates found");
  assert(data.base === "USD", "Exchange rates must be in USD");

  const ret = nonUsdCurrencies.map((c) => {
    const { name, symbol, currency, decimals } = c;
    const rateUSD = Number(data.rates[c.currency]);
    assert(rateUSD > 0, `Exchange rate invalid: ${c.currency} ${rateUSD}`);
    return { name, symbol, currency, decimals, rateUSD };
  });

  return ret;
}

const cache = {
  timeS: 0,
  ratesPromise: Promise.resolve([] as CurrencyExchangeRate[]),
};

export async function getExchangeRatesCached(vc: ViemClient) {
  const elapsedS = now() - cache.timeS;
  if (elapsedS > 300) {
    console.log(`[API] getExchangeRates: cache stale, fetching currency rates`);
    cache.ratesPromise = getExchangeRates(vc);
    cache.timeS = now();
  }
  return cache.ratesPromise;
}
