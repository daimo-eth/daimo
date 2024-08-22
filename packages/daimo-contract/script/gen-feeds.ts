import { assert, debugJson } from "@daimo/common";
import fs from "node:fs/promises";
import { getAddress } from "viem";

import { getTokensForChain } from "../dist";
import { ChainlinkFeed } from "../src/chainlinkFeed";

// TODO

/**
 * Usage: npx ts-node generate.ts
 *
 * Filters raw Chainlink feed info to get valid (token) / USD reference price
 * feeds on each supported chain. Gets the address of the token using CoinGecko
 * data. Pulls the latest price from Chainlink as a sanity check.
 *
 * Reads 1-raw-feed-info directory. See:
 *  - https://docs.chain.link/data-feeds/price-feeds
 *  - https://reference-data-directory.vercel.app/feeds-mainnet.json, etc
 *
 * Writes 2-feeds.json
 */
async function main() {
  console.log("Chainlink feed info generator...");

  // read all files in ./1-raw-feed-info
  const clDir = "./script/chainlink";
  const rawDir = `${clDir}/1-raw-feed-info`;
  const rawNames = await fs.readdir(rawDir);
  const rawJsons = await Promise.all(
    rawNames.map(async (file) => {
      const raw = await fs.readFile(`${rawDir}/${file}`);
      return JSON.parse(raw.toString());
    })
  );

  // Example feed info, raw JSON file:
  // [
  //     {
  //         "compareOffchain": "",
  //         "contractAddress": "0x02f5E9e9dcc66ba6392f6904D5Fcf8625d9B19C9",
  //         "contractType": "",
  //         "contractVersion": 4,
  //         "decimalPlaces": 9,
  //         "ens": "eth-usd",
  //         "formatDecimalPlaces": 0,
  //         "healthPrice": "",
  //         "heartbeat": 1200,
  //         "history": false,
  //         "multiply": "100000000",
  //         "name": "ETH / USD",
  //         "pair": ["ETH", "USD"],
  //         "path": "eth-usd",
  //         "proxyAddress": "0x13e3Ee699D1909E989722E753853AE30b17e08c5",
  //         "threshold": 0.15,
  //         "assetName": "Ethereum",
  //         "feedCategory": "low",
  //         "feedType": "Crypto",
  //         "decimals": 8,
  //         "docs": {
  //             "baseAsset": "ETH",
  //             "quoteAsset": "USD",
  //             "blockchainName": "Optimism",
  //             "clicProductName": "ETH/USD-RefPrice-DF-Optimism-001",
  //             ...
  //         },
  //         ...
  //     },
  //     ...
  // Filter to feedType = Crypto, quoteAsset = USD
  // Produce a single list of { chain, feedAddress, tokenName, decimals }
  const ret: ChainlinkFeed[] = [];

  for (const raw of rawJsons) {
    const chainName = raw[0].docs.blockchainName;
    const chainId = (function () {
      switch (chainName) {
        case "Ethereum":
          return 1;
        case "Base":
          return 8453;
        case "Optimism":
          return 10;
        case "Arbitrum":
          return 42161;
        case "Matic":
          return 137;
        case "Avalanche":
          return 43114;
        default:
          throw new Error("Unknown chain name: " + chainName);
      }
    })();
    const tokens = getTokensForChain(chainId);
    console.log(`Processing ${chainName} ${chainId}, ${tokens.length} toks...`);

    for (const feed of raw) {
      if (
        feed.feedType !== "Crypto" ||
        feed.docs.quoteAsset !== "USD" ||
        feed.docs.deliveryChannelCode !== "DF" ||
        feed.docs.baseAsset == null ||
        feed.docs.blockchainName == null
      ) {
        continue;
      }

      if (feed.docs.blockchainName !== chainName) {
        console.log(`Skipping feed, wrong chain: ${debugJson(feed)}`);
        continue;
      }
      assert(feed.docs.blockchainName === chainName, feed.docs.blockchainName);
      const feedAddress = getAddress(feed.contractAddress);
      const tokenSymbol = feed.docs.baseAsset;
      const decimals = feed.decimals;

      // Look up chain, token
      const token = tokens.find((t) => t.symbol === tokenSymbol);
      if (token == null) {
        console.log(`Skipping ${tokenSymbol} on ${chainName}, not found`);
        continue;
      }
      assert(decimals > 0);

      ret.push({
        chainId,
        feedAddress,
        tokenSymbol,
        tokenAddress: getAddress(token.token),
        decimals,
      });
    }
  }

  // Write to 2-feeds.json
  await fs.writeFile(`${clDir}/2-feeds.json`, JSON.stringify(ret, null, 2));

  // TODO: validate by fetching Uniswap + Chainlink price, output
  // Write 3-validation-prices.csv
}

main()
  .then(() => console.log("Done"))
  .catch((e) => console.error(e));
