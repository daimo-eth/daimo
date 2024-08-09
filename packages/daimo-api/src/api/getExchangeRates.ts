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
  // Fetch JSON from EXCHANGE_RATES_URL using fetch() for non-USD currencies
  const ratesUrl = getEnvApi().EXCHANGE_RATES_URL;
  console.log(`[API] fetching exchange rates from ${ratesUrl}`);
  const res = await fetchWithBackoff(new URL(ratesUrl));
  if (!res.ok) {
    throw new Error(`Failed to fetch exchange rates: ${res.statusText}`);
  }
  const retObj = await res.json();

  // Replace ARS and BOB with Blue Dollar rate if available
  const LATIN_AMERICA_EXCHANGE_RATE_URL = "https://criptoya.com/api/";
  const ars_url = LATIN_AMERICA_EXCHANGE_RATE_URL + "usdt/ars";
  console.log(`[API] fetching blue dollar ARS rate from ${ars_url}`);
  const arsRes = await fetchWithBackoff(new URL(ars_url));
  if (arsRes.ok) {
    const arsObj = await arsRes.json();
    if (arsObj.binancep2p && arsObj.binancep2p.ask > 0) {
      const midMarketRate = (arsObj.binancep2p.ask + arsObj.binancep2p.bid) / 2;
      retObj.rates["ARS"] = midMarketRate;
    }
  }
  const bob_url = LATIN_AMERICA_EXCHANGE_RATE_URL + "usdt/bob";
  console.log(`[API] fetching blue dollar BOB rate from ${bob_url}`);
  const bobRes = await fetchWithBackoff(new URL(bob_url));
  if (bobRes.ok) {
    const bobObj = await bobRes.json();
    if (bobObj.binancep2p && bobObj.binancep2p.ask > 0) {
      const midMarketRate = (bobObj.binancep2p.ask + bobObj.binancep2p.bid) / 2;
      retObj.rates["BOB"] = midMarketRate;
    }
  }

  const retStr = JSON.stringify(retObj);
  console.log(`[API] got currency exchange rates: ${retStr}`);
  return retStr;
}
