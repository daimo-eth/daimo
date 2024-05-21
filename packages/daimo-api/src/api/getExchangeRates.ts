import { CurrencyExchangeRate, nonUsdCurrencies, now } from "@daimo/common";

import { ViemClient } from "../network/viemClient";

export async function getExchangeRates(vc: ViemClient) {
  const oracles = nonUsdCurrencies.map((c) => c.usdPairChainlinkAddress);
  const answers = await vc.getChainLinkAnswers(oracles);

  const ret = [] as CurrencyExchangeRate[];

  for (const i in answers) {
    const answer = answers[i];
    if (answer.status !== "success" || answer.result == null) {
      console.warn(`[API] getExchangeRates: skipping error`, answer);
      continue;
    }
    const { name, symbol, currency } = nonUsdCurrencies[i];
    const rateUSD = Number(answer.result) / 1e8;
    ret.push({ name, symbol, currency, rateUSD });
  }

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
