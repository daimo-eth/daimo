import {
  CurrencyExchangeRate,
  assert,
  nonUsdCurrencies,
  retryBackoff,
} from "@daimo/common";

import { ExternalApiCache } from "../db/externalApiCache";
import { getEnvApi } from "../env";
import { fetchWithBackoff } from "../network/fetchWithBackoff";

let promise: Promise<CurrencyExchangeRate[]> | null = null;

export async function getExchangeRates(extApiCache: ExternalApiCache) {
  // If concurrent users want exchange rates, only fetch once.
  if (promise == null) {
    promise = getExchangeRatesInner(extApiCache);
  }
  try {
    return await promise;
  } finally {
    promise = null;
  }
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
  // Fetch JSON from EXCHANGE_RATES_URL using fetch() for non-USD currencies
  const ratesUrl = getEnvApi().EXCHANGE_RATES_URL;
  console.log(`[API] fetching exchange rates from ${ratesUrl}`);
  const res = await fetchWithBackoff(new URL(ratesUrl));
  if (!res.ok) {
    throw new Error(`Failed to fetch exchange rates: ${res.statusText}`);
  }
  const retObj = await res.json();

  // Replace ARS and BOB with Blue Dollar rate if available
  const arsUSD = await getLatamRate("usdt/ars");
  const bobUSD = await getLatamRate("usdt/bob");
  if (arsUSD != null) retObj.rates["ARS"] = arsUSD;
  if (bobUSD != null) retObj.rates["BOB"] = bobUSD;

  const retStr = JSON.stringify(retObj);
  console.log(`[API] got currency exchange rates: ${retStr}`);
  return retStr;
}

async function getLatamRate(pairPath: string) {
  const LATIN_AMERICA_EXCHANGE_RATE_URL = "https://criptoya.com/api/";
  const url = LATIN_AMERICA_EXCHANGE_RATE_URL + pairPath;
  console.log(`[API] fetching blue dollar rate for ${pairPath} from ${url}`);
  const res = await fetchWithBackoff(new URL(url));
  if (!res.ok) {
    console.log(`Failed to fetch Latam exchange rates: ${res}`);
    return null;
  }
  const rateObj = await res.json();
  if (rateObj.binancep2p == null) return null;
  const { ask, bid } = rateObj.binancep2p;
  if (!(ask > 0 && bid > 0)) return null;

  const midMarketRate = (ask + bid) / 2;
  return midMarketRate;
}
