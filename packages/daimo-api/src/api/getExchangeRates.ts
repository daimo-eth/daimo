import {
  CurrencyExchangeRate,
  assert,
  nonUsdCurrencies,
  now,
} from "@daimo/common";

import { getEnvApi } from "../env";
import { fetchWithBackoff } from "../network/fetchWithBackoff";
import { ViemClient } from "../network/viemClient";
import { retryBackoff } from "../utils/retryBackoff";

export async function getExchangeRates(vc: ViemClient) {
  const data = await retryBackoff("fetchExchangeRates", async () => {
    // Fetch JSON from EXCHANGE_RATES_URL using fetch()
    const ratesUrl = getEnvApi().EXCHANGE_RATES_URL;
    console.log(`[API] fetching exchange rates from ${ratesUrl}`);
    const res = await fetchWithBackoff(new URL(ratesUrl));
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
    const rateUSD = 1 / Number(data.rates[c.currency]);
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
