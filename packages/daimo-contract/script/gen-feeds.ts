import { assert, debugJson } from "@daimo/common";
import fs from "node:fs/promises";
import {
  Address,
  Chain,
  createPublicClient,
  getAddress,
  http,
  maxUint128,
  PublicClient,
} from "viem";
import { arbitrum, optimism, base, polygon } from "viem/chains";

import {
  daimoFlexSwapperABI,
  aggregatorV2V3InterfaceABI,
  getTokensForChain,
  getAccountChain,
  erc20ABI,
} from "../src";
import { ChainlinkFeed } from "../src/chainlinkFeed";

const alchemyKey = process.env.ALCHEMY_API_KEY;
if (alchemyKey == null) throw new Error("Missing ALCHEMY_API_KEY");

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
  const clients: Map<number, PublicClient | null> = new Map();

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
        feed.docs.blockchainName == null ||
        feed.proxyAddress == null
      ) {
        continue;
      }

      if (feed.docs.blockchainName !== chainName) {
        console.log(`Skipping feed, wrong chain: ${debugJson(feed)}`);
        continue;
      }
      assert(feed.docs.blockchainName === chainName, feed.docs.blockchainName);
      const feedAddress = getAddress(feed.proxyAddress);
      const tokenSymbol = feed.docs.baseAsset;
      const decimals = feed.decimals;
      assert(decimals > 0);

      // Look up chain, token
      const possibleTokens = tokens.filter((t) => t.symbol === tokenSymbol);
      if (possibleTokens.length === 0) {
        console.log(`Skipping ${tokenSymbol} on ${chainName}, not found`);
        continue;
      }
      let token = possibleTokens[0];
      if (possibleTokens.length > 1) {
        const client = getCachedClient(clients, chainId);
        if (client == null) {
          console.log(
            `Skipping AMBIGUOUS ${tokenSymbol} on UNSUPPORTED ${chainName}`
          );
          continue;
        }
        const accChain = getAccountChain(chainId);
        const opts = [] as any[];
        for (const pt of possibleTokens) {
          const { status } = await quoteFeed(
            client,
            {
              chainId,
              feedAddress,
              tokenSymbol: pt.symbol,
              tokenAddress: getAddress(pt.token),
              decimals,
            },
            accChain.bridgeCoin.token
          );
          opts.push({ token: pt, status });
        }
        const jsonOpts = JSON.stringify(opts);
        const goodTokens = opts.filter((opt) => opt.status === "ok");
        if (goodTokens.length === 0) {
          console.log(
            `Skipping AMBIGUOUS ${tokenSymbol} on ${chainName}, none priceable: ${jsonOpts}`
          );
          continue;
        } else if (goodTokens.length > 1) {
          throw new Error(
            `AMBIGUOUS: ${tokenSymbol} on ${chainName}: ${jsonOpts}`
          );
        }
        token = goodTokens[0].token;
      }

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

  // Validate by fetching Uniswap + Chainlink price, output
  const validFeeds: ChainlinkFeed[] = [];
  const prices = [] as any[];
  for (const feed of ret) {
    // Get Viem client
    const client = getCachedClient(clients, feed.chainId);
    if (client == null) continue; // skip unsupported chains

    // Get Daimo chain
    const accChain = getAccountChain(feed.chainId);

    // Fetch onchain quotes from Uniswap and Chainlink to compare
    console.log(`Quoting ${JSON.stringify(feed)}`);

    let clPrice = "";
    let clAgeS = NaN;
    let clDec = NaN;
    let tokenDec = NaN;
    let uniPrice = "";
    let diffPercent = NaN;
    let status = "";

    try {
      const ret = await quoteFeed(client, feed, accChain.bridgeCoin.token);
      ({ clPrice, clAgeS, clDec, tokenDec, uniPrice, diffPercent, status } =
        ret);
    } catch (e) {
      status = `ERROR: ${e.message}`;
    }

    const price = {
      ...feed,
      clPrice,
      clAgeS,
      clDec,
      tokenDec,
      uniPrice,
      diffPercent,
      status,
    };
    prices.push(price);

    if (status === "ok") {
      validFeeds.push(feed);
      console.log(`Priced ${feed.tokenSymbol}: ${JSON.stringify(price)}`);
    } else {
      console.error(
        `ERROR pricing ${feed.tokenSymbol}: ${JSON.stringify(price)}`
      );
    }
  }

  // Write 3-validation-prices.json
  await fs.writeFile(
    `${clDir}/3-validation-prices.json`,
    JSON.stringify(prices, null, 2)
  );

  // Finally, write src/codegen/feeds.json, valid feeds only.
  await fs.writeFile(
    `src/codegen/feeds.json`,
    JSON.stringify(validFeeds, null, 2)
  );
}

async function quoteFeed(
  client: PublicClient,
  feed: ChainlinkFeed,
  usdcAddr: Address
) {
  const ans = await client.multicall({
    contracts: [
      {
        abi: aggregatorV2V3InterfaceABI,
        address: feed.feedAddress,
        functionName: "decimals",
      },
      {
        abi: aggregatorV2V3InterfaceABI,
        address: feed.feedAddress,
        functionName: "latestRoundData",
      },
      {
        abi: daimoFlexSwapperABI,
        address: "0xd4f52859A6Fa075A6253C46A4D6367f2F8247165",
        functionName: "quote",
        args: [
          usdcAddr,
          1_000_000n, // $1 of USDC
          feed.tokenAddress,
        ],
      },
      {
        abi: erc20ABI,
        address: feed.tokenAddress,
        functionName: "decimals",
      },
    ],
    allowFailure: true,
  });

  const err = ans[0].error || ans[2].error || ans[3].error;
  if (err) {
    throw new Error(`Error quoting ${JSON.stringify(feed)}: ${err.message}`);
  }

  // [clDec, clRoundData, uniQuote, tokenDec]
  const clDec = assertNotNull(ans[0].result);
  // const clRoundData = assertNotNull(ans[1].result);
  const uniQuote = assertNotNull(ans[2].result);
  const tokenDec = assertNotNull(ans[3].result);

  let status = "ok";
  let clPriceN = NaN;
  let clAgeS = NaN;
  if (ans[1].error != null) {
    const { message } = ans[1].error;
    if (message.includes("No access")) {
      status = "CL: Revert: No access";
    } else {
      status = "CL: " + ans[1].error.message;
    }
  } else {
    const clRoundData = ans[1].result;
    const roundId = clRoundData[0];
    const answer = clRoundData[1];
    // Skip startedAt, clRoundData[2]
    const updatedAt = clRoundData[3];
    const answeredInRound = clRoundData[4];

    // Is it valid?
    const now = (Date.now() / 1e3) | 0;
    const maxFeedRoundAge = 24 * 60 * 60; // 1 day
    clAgeS = now - Number(updatedAt);
    if (answer <= 0) status = "DFS: CL price <= 0";
    else if (clAgeS > maxFeedRoundAge) status = "DFS: CL old";
    else if (answeredInRound < roundId)
      status = `DFS: CL wrong round, ${answeredInRound} < ${roundId}`;
    else if (answer >= maxUint128) status = "DFS: CL price too large";

    clPriceN = Number(answer) / 10 ** clDec;
  }

  // Get Uniswap price
  assert(tokenDec >= 6, "Token with <6 decimals");
  const uniPriceN = 10 ** tokenDec / Number(uniQuote[0]);
  const uniPrice = uniPriceN.toFixed(6);

  const clPrice = clPriceN.toFixed(clDec);
  const diffPercent = (clPriceN - uniPriceN) / (clPriceN + uniPriceN) / 0.005;
  const maxDiffPercent = 4;
  if (status === "ok") {
    status = Math.abs(diffPercent) < maxDiffPercent ? "ok" : "FAIL";
  }

  return { clPrice, clAgeS, clDec, uniPrice, diffPercent, tokenDec, status };
}

function assertNotNull<T>(x: T | null | undefined): T {
  if (x == null) throw new Error("Unexpected null");
  return x;
}

function getCachedClient(
  clients: Map<number, PublicClient | null>,
  chainId: number
) {
  let client = clients.get(chainId);
  if (client == null) {
    client = getPublicClient(chainId);
    clients.set(chainId, client);
  }
  return client;
}

function getPublicClient(chainId: number): PublicClient | null {
  const chains = [arbitrum, optimism, base, polygon];
  const chain = Object.values(chains).find((c) => c.id === chainId) as Chain;
  if (chain == null) return null;
  return createPublicClient({
    chain,
    transport: http(chain.rpcUrls.alchemy.http[0] + "/" + alchemyKey),
  });
}

main()
  .then(() => console.log("Done"))
  .catch((e) => console.error(e));
