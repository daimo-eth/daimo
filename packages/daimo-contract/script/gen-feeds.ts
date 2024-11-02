import fs from "node:fs/promises";
import {
  Chain,
  createPublicClient,
  getAddress,
  http,
  maxUint128,
  parseUnits,
  PublicClient,
} from "viem";
import {
  arbitrum,
  base,
  bsc,
  linea,
  mainnet,
  optimism,
  polygon,
} from "viem/chains";

import {
  aggregatorV2V3InterfaceAbi,
  arbitrumWETH,
  baseWETH,
  bscWBNB,
  daimoFlexSwapperAbi,
  daimoFlexSwapperUniOnlyAddress,
  erc20Abi,
  ethereumWETH,
  ForeignToken,
  getAlchemyTransportUrl,
  getDAv2Chain,
  lineaWETH,
  optimismWETH,
  polygonWETH,
  polygonWMATIC,
} from "../src";
import { ChainlinkFeed, PricedToken } from "./scriptModels";
import { assert, assertNotNull, chunkArray } from "./util";

const alchemyKey = process.env.ALCHEMY_API_KEY;
if (alchemyKey == null) throw new Error("Missing ALCHEMY_API_KEY");

const chains = [mainnet, arbitrum, optimism, base, polygon, linea, bsc];

const chainlinkJsonUrls = [
  "https://reference-data-directory.vercel.app/feeds-mainnet.json",
  "https://reference-data-directory.vercel.app/feeds-ethereum-mainnet-arbitrum-1.json",
  "https://reference-data-directory.vercel.app/feeds-ethereum-mainnet-optimism-1.json",
  "https://reference-data-directory.vercel.app/feeds-ethereum-mainnet-base-1.json",
  "https://reference-data-directory.vercel.app/feeds-matic-mainnet.json",
  "https://reference-data-directory.vercel.app/feeds-ethereum-mainnet-linea-1.json",
  "https://reference-data-directory.vercel.app/feeds-bsc-mainnet.json",
];

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

  // load feed metadata from Chainlink JSON API to 1-raw-feed-info/
  const clDir = "./script/chainlink";
  const rawDir = `${clDir}/1-raw-feed-info`;
  await downloadFiles(rawDir, chainlinkJsonUrls);

  // read all files in ./1-raw-feed-info
  const rawNames = await fs.readdir(rawDir);
  const rawJsons = await Promise.all(
    rawNames.map(async (file) => {
      const raw = await fs.readFile(`${rawDir}/${file}`);
      return JSON.parse(raw.toString());
    }),
  );
  const nTotalFeeds = rawJsons.reduce((sum, r) => sum + r.length, 0);
  console.log(`1-raw-feed-info/: ${nTotalFeeds} total feeds`);

  // extract valid Chainlink feeds
  const feeds = parseChainlinkFeeds(rawJsons);
  console.log(`2-feeds.json: ${feeds.length} valid token price feeds`);
  await fs.writeFile(`${clDir}/2-feeds.json`, toJSON(feeds));

  // merge feeds and tokens
  const tokensJson = await fs.readFile("src/codegen/tokens.json");
  const tokens = JSON.parse(tokensJson.toString()) as ForeignToken[];
  tokens.push(...getWETHAndWMATIC());
  const tokenFeeds = mergeTokensWithFeeds(tokens, feeds);

  // price, write to 3-priced-tokens.json, validate
  const pricedTokens = await priceTokens(tokenFeeds);
  await fs.writeFile(`${clDir}/3-priced-tokens.csv`, toCSV(pricedTokens));

  // finally, output validated feeds.
  // - automatic validation. Uniswap price matches Chainlink price:
  const validFeeds = pricedTokens
    .filter((pt) => pt.status === "ok")
    .map(({ chainId, tokenSymbol, tokenAddress, chainlinkFeedAddress }) => ({
      chainId,
      tokenSymbol,
      tokenAddress,
      chainlinkFeedAddress,
      skipUniswap: !!chainlinkFeedAddress,
    }));

  // write 4-valid-feeds.json
  await fs.writeFile(`${clDir}/4-valid-feeds.jsonl`, toJSONL(validFeeds));
}

function downloadFiles(dir: string, urls: string[]) {
  return Promise.all(
    urls.map(async (url, i) => {
      const filename = url.split("/").pop();
      const raw = await fetch(url).then((r) => r.text());
      console.log(`Writing ${raw.length}ch to ${dir}/${filename}`);
      await fs.writeFile(`${dir}/${filename}`, raw);
    }),
  );
}

function getWETHAndWMATIC(): ForeignToken[] {
  return [
    { ...ethereumWETH, symbol: "ETH" },
    { ...arbitrumWETH, symbol: "ETH" },
    { ...optimismWETH, symbol: "ETH" },
    { ...baseWETH, symbol: "ETH" },
    { ...polygonWETH, symbol: "ETH" },
    { ...polygonWMATIC, symbol: "MATIC" },
    { ...lineaWETH, symbol: "ETH" },
    { ...bscWBNB, symbol: "BNB" },
  ];
}

// Example feed info:
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
function parseChainlinkFeeds(rawJsons: any[]): ChainlinkFeed[] {
  const ret: ChainlinkFeed[] = [];
  for (const rJson of rawJsons) {
    const chainName = rJson.find((r) => r.docs.blockchainName != null)?.docs
      .blockchainName;
    if (chainName == null) {
      console.log(`Skipping feed, no chain name: ${JSON.stringify(rJson)}`);
      continue;
    } else {
      console.log(`Processing ${chainName}`);
    }
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
        case "Linea":
          return 59144;
        case "Binance":
          return 56;
        default:
          throw new Error("Unknown chain name: " + chainName);
      }
    })();
    for (const rFeed of rJson) {
      if (
        rFeed.feedType !== "Crypto" ||
        rFeed.docs.quoteAsset !== "USD" ||
        rFeed.docs.deliveryChannelCode !== "DF" ||
        rFeed.docs.baseAsset == null ||
        rFeed.docs.blockchainName == null ||
        rFeed.proxyAddress == null ||
        rFeed.docs.clicProductName.includes("MarketCap") ||
        rFeed.docs.clicProductName.includes("MCap")
      ) {
        continue;
      }

      if (rFeed.docs.blockchainName !== chainName) {
        console.log(`Skipping feed, wrong chain: ${JSON.stringify(rFeed)}`);
        continue;
      }
      assert(
        rFeed.docs.blockchainName === chainName,
        rFeed.docs.blockchainName,
      );
      const feedAddress = getAddress(rFeed.proxyAddress);
      const tokenSymbol = rFeed.docs.baseAsset as string;
      const feedDecimals = rFeed.decimals as number;
      assert(feedDecimals > 0);

      // Valid-looking Chainlink feed
      const feed: ChainlinkFeed = {
        chainId,
        tokenSymbol,
        feedAddress,
        feedDecimals,
      };

      ret.push(feed);
    }
  }
  return ret;
}

function mergeTokensWithFeeds(
  tokens: ForeignToken[],
  feeds: ChainlinkFeed[],
): { token: ForeignToken; feed: ChainlinkFeed }[] {
  const ret = [] as { token: ForeignToken; feed: ChainlinkFeed }[];
  for (const token of tokens) {
    const possibleFeeds = feeds.filter(
      (f) =>
        f.chainId === token.chainId &&
        f.tokenSymbol.toUpperCase() === token.symbol.toUpperCase(),
    );
    if (possibleFeeds.length > 1) {
      throw new Error(`Duplicate feeds: ${JSON.stringify(possibleFeeds)}`);
    }
    const feed = possibleFeeds[0];
    ret.push({ token, feed });
  }

  const unmatchedFeeds = feeds.filter((f) => !ret.some((tf) => tf.feed === f));
  console.log(`Unmatched feeds: ${unmatchedFeeds.length}`);
  for (const f of unmatchedFeeds) {
    console.log(`  ${f.chainId}, ${f.tokenSymbol}, ${f.feedAddress}`);
  }

  return ret;
}

async function priceTokens(
  tfs: { token: ForeignToken; feed: ChainlinkFeed }[],
): Promise<PricedToken[]> {
  const ret: PricedToken[] = [];
  const clients = new Map<number, PublicClient>();

  const chainId = 0;
  let blockNumber = 0;
  let blockTimestamp = 0;

  const concurrency = 20;
  const chunks = chunkArray(tfs, concurrency);

  for (const chunk of chunks) {
    const promises = chunk.map(async ({ token, feed }) => {
      const client = getCachedClient(clients, token.chainId);
      if (token.chainId !== chainId) {
        const block = await client.getBlock({ blockTag: "latest" });
        blockNumber = Number(block.number);
        blockTimestamp = Number(block.timestamp);
      }

      const accChain = getDAv2Chain(token.chainId);
      const usdc = accChain.localUSDC;

      // Get Chainlink price feed for this token, if available
      try {
        const tokenWithPrice = await quoteToken({
          blockNumber,
          blockTimestamp,
          client,
          token,
          feed,
          usdc,
        });
        const { status, uniswapPrice, chainlinkPrice } = tokenWithPrice;
        console.log(
          `${accChain.name} ${token.symbol}: ${status} uniswap ${uniswapPrice} chainlink ${chainlinkPrice}`,
        );
        return tokenWithPrice;
      } catch (e) {
        console.error(`ERROR ${accChain.name} ${token.symbol}: ${e.message}`);
        return null;
      }
    });

    const results = await Promise.all(promises);
    ret.push(...(results.filter((f) => f != null) as PricedToken[]));
  }

  return ret;
}

async function quoteToken({
  blockNumber,
  blockTimestamp,
  client,
  token,
  feed,
  usdc,
}: {
  blockNumber: number;
  blockTimestamp: number;
  client: PublicClient;
  token: ForeignToken;
  feed?: ChainlinkFeed;
  usdc: ForeignToken;
}): Promise<PricedToken> {
  const tokenAddress = token.token;

  // First, quote Uniswap
  const [uniQuote, tokenDec] = await client.multicall({
    contracts: [
      {
        abi: daimoFlexSwapperAbi,
        address: daimoFlexSwapperUniOnlyAddress(token.chainId),
        functionName: "quote",
        args: [
          usdc.token,
          parseUnits("1", usdc.decimals), // $1 of USDC
          tokenAddress,
        ],
      },
      {
        abi: erc20Abi,
        address: tokenAddress,
        functionName: "decimals",
      },
    ],
    allowFailure: false,
    blockNumber: BigInt(blockNumber),
  });

  assert(tokenDec === token.decimals, `${token.symbol} decimals mismatch`);
  const uniPrice = 10 ** tokenDec / Number(uniQuote[0]);

  // Then, quote Chainlink, if available
  let status: string;
  const clDec = NaN;
  let clPrice = NaN;
  let clAgeS = NaN;
  let diffPercent = NaN;

  if (feed == null) {
    status = Number.isFinite(uniPrice) ? "uni only" : "FAIL: no price";
  } else {
    const [clDec, clRoundData] = await client.multicall({
      contracts: [
        {
          abi: aggregatorV2V3InterfaceAbi,
          address: feed.feedAddress,
          functionName: "decimals",
        },
        {
          abi: aggregatorV2V3InterfaceAbi,
          address: feed.feedAddress,
          functionName: "latestRoundData",
        },
      ],
      allowFailure: false,
      blockNumber: BigInt(blockNumber),
    });
    const roundId = clRoundData[0];
    const answer = clRoundData[1];
    // Skip startedAt, clRoundData[2]
    const updatedAt = clRoundData[3];
    const answeredInRound = clRoundData[4];

    // Check validity + check diff between Uniswap and Chainlink prices
    const now = (Date.now() / 1e3) | 0;
    const maxFeedRoundAge = 24 * 60 * 60; // 1 day
    clAgeS = now - Number(updatedAt);
    clPrice = Number(answer) / 10 ** clDec;
    diffPercent = (clPrice - uniPrice) / (clPrice + uniPrice) / 0.005;
    const maxDiffPercent = 4;

    if (answer <= 0) status = "FAIL: CL price <= 0";
    else if (clAgeS > maxFeedRoundAge) status = "FAIL: CL old";
    else if (answeredInRound < roundId)
      status = `FAIL: CL wrong round, ${answeredInRound} < ${roundId}`;
    else if (answer >= maxUint128) status = "FAIL: CL price too large";
    else status = Math.abs(diffPercent) < maxDiffPercent ? "ok" : "FAIL: diff";
  }

  return {
    chainId: token.chainId,
    tokenSymbol: token.symbol,
    tokenAddress,
    tokenName: assertNotNull(token.name),
    tokenDecimals: tokenDec,
    logoURI: token.logoURI,
    blockNumber,
    blockTimestamp,
    uniswapPrice: uniPrice,
    chainlinkFeedAddress: feed?.feedAddress,
    chainlinkDecimals: clDec,
    chainlinkPrice: clPrice,
    chainlinkAgeS: clAgeS,
    diffPercent,
    status,
  };
}

function getCachedClient(clients: Map<number, PublicClient>, chainId: number) {
  let client = clients.get(chainId);
  if (client == null) {
    client = getPublicClient(chainId);
    clients.set(chainId, client);
  }
  return client;
}

function getPublicClient(chainId: number): PublicClient {
  const chain = Object.values(chains).find((c) => c.id === chainId) as Chain;
  if (chain == null) throw new Error("Unsupported chain: " + chainId);
  if (alchemyKey == null) throw new Error("Missing Alchemy key");

  const rpcUrl = getAlchemyTransportUrl(chain.id, alchemyKey);
  const transport = http(rpcUrl);
  return createPublicClient({ chain, transport });
}

function toJSON(obj: any): string {
  return JSON.stringify(obj, null, 2);
}

function toJSONL(arr: any[]): string {
  return arr.map((o) => JSON.stringify(o)).join("\n");
}

function toCSV(tokensWithFeeds: PricedToken[]): string {
  const lines = [] as string[];
  const cols: (keyof PricedToken)[] = [
    "chainId",
    "tokenSymbol",
    "tokenAddress",
    "tokenName",
    "tokenDecimals",
    "logoURI",
    "blockNumber",
    "blockTimestamp",
    "uniswapPrice",
    "chainlinkFeedAddress",
    "chainlinkDecimals",
    "chainlinkPrice",
    "chainlinkAgeS",
    "diffPercent",
    "status",
  ];
  lines.push(cols.join(","));
  for (const token of tokensWithFeeds) {
    const line = cols.map((col) => JSON.stringify(token[col]));
    lines.push(line.join(","));
  }
  return lines.join("\n");
}

main()
  .then(() => console.log("done"))
  .catch((e) => console.error(e));
