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
import { arbitrum, base, mainnet, optimism, polygon } from "viem/chains";

import { ChainlinkFeed, PricedToken } from "./scriptModels";
import { assert, assertNotNull } from "./util";
import {
  aggregatorV2V3InterfaceAbi,
  arbitrumWETH,
  baseWETH,
  daimoFlexSwapperAbi,
  erc20Abi,
  ethereumWETH,
  ForeignToken,
  getDAv2Chain,
  optimismWETH,
  polygonWETH,
  polygonWMATIC,
} from "../src";

const alchemyKey = process.env.ALCHEMY_API_KEY;
if (alchemyKey == null) throw new Error("Missing ALCHEMY_API_KEY");

const chains = [mainnet, arbitrum, optimism, base, polygon];

const chainlinkJsonUrls = [
  "https://reference-data-directory.vercel.app/feeds-mainnet.json",
  "https://reference-data-directory.vercel.app/feeds-ethereum-mainnet-arbitrum-1.json",
  "https://reference-data-directory.vercel.app/feeds-ethereum-mainnet-optimism-1.json",
  "https://reference-data-directory.vercel.app/feeds-ethereum-mainnet-base-1.json",
  "https://reference-data-directory.vercel.app/feeds-matic-mainnet.json",
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
    })
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
      skipUniswap: false,
    }));
  const tokenToFeed = new Map(
    pricedTokens
      .filter((pt) => pt.chainlinkFeedAddress != null)
      .map(({ tokenAddress, chainlinkFeedAddress }) => [
        tokenAddress,
        chainlinkFeedAddress,
      ])
  );

  // - manual validation for rebasing tokens, etc.
  const chainlinkOnlyTokens = [
    [1, "USDV", "0x0E573Ce2736Dd9637A0b21058352e1667925C7a8"],
    [1, "FRAX", "0x853d955aCEf822Db058eb8505911ED77F175b99e"],
    [1, "FDUSD", "0xc5f0f7b66764F6ec8C8Dff7BA683102295E16409"],
    [1, "PYUSD", "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8"],
  ] as [number, string, Address][];
  validFeeds.push(
    ...chainlinkOnlyTokens.map(([chainId, tokenSymbol, tokenAddress]) => ({
      chainId,
      tokenSymbol,
      tokenAddress,
      chainlinkFeedAddress: tokenToFeed.get(tokenAddress),
      skipUniswap: true,
    }))
  );

  // write 4-valid-feeds.json
  await fs.writeFile(`${clDir}/4-valid-feeds.json`, toJSONL(validFeeds));
}

function downloadFiles(dir: string, urls: string[]) {
  return Promise.all(
    urls.map(async (url, i) => {
      const filename = url.split("/").pop();
      const raw = await fetch(url).then((r) => r.text());
      console.log(`Writing ${raw.length}ch to ${dir}/${filename}`);
      await fs.writeFile(`${dir}/${filename}`, raw);
    })
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
    const chainName = rJson[0].docs.blockchainName;
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
        rFeed.docs.blockchainName
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
  feeds: ChainlinkFeed[]
): { token: ForeignToken; feed: ChainlinkFeed }[] {
  const ret = [] as { token: ForeignToken; feed: ChainlinkFeed }[];
  for (const token of tokens) {
    const possibleFeeds = feeds.filter(
      (f) =>
        f.chainId === token.chainId &&
        f.tokenSymbol.toUpperCase() === token.symbol.toUpperCase()
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
  tfs: { token: ForeignToken; feed: ChainlinkFeed }[]
): Promise<PricedToken[]> {
  const ret: PricedToken[] = [];
  const clients = new Map<number, PublicClient>();

  const chainId = 0;
  let blockNumber = 0;
  let blockTimestamp = 0;

  for (const { token, feed } of tfs) {
    const client = getCachedClient(clients, token.chainId);
    if (token.chainId !== chainId) {
      const block = await client.getBlock({ blockTag: "latest" });
      blockNumber = Number(block.number);
      blockTimestamp = Number(block.timestamp);
    }

    const accChain = getDAv2Chain(token.chainId);
    const usdcAddr = accChain.bridgeCoin.token;

    // Get Chainlink price feed for this token, if available
    try {
      const tokenWithPrice = await quoteToken({
        blockNumber,
        blockTimestamp,
        client,
        token,
        feed,
        usdcAddr,
      });
      const { status, uniswapPrice, chainlinkPrice } = tokenWithPrice;
      console.log(
        `${accChain.name} ${token.symbol}: ${status} uniswap ${uniswapPrice} chainlink ${chainlinkPrice}`
      );
      ret.push(tokenWithPrice);
    } catch (e) {
      console.error(`ERROR ${accChain.name} ${token.symbol}: ${e.message}`);
    }
  }

  return ret;
}

async function quoteToken({
  blockNumber,
  blockTimestamp,
  client,
  token,
  feed,
  usdcAddr,
}: {
  blockNumber: number;
  blockTimestamp: number;
  client: PublicClient;
  token: ForeignToken;
  feed?: ChainlinkFeed;
  usdcAddr: Address;
}): Promise<PricedToken> {
  const tokenAddress = token.token;

  // First, quote Uniswap
  const swapperAddr =
    token.chainId === 1
      ? "0x207e87f84cff325715f324d09e63b21a03e53b61"
      : "0xd4f52859A6Fa075A6253C46A4D6367f2F8247165";
  const [uniQuote, tokenDec] = await client.multicall({
    contracts: [
      {
        abi: daimoFlexSwapperAbi,
        address: swapperAddr,
        functionName: "quote",
        args: [
          usdcAddr,
          1_000_000n, // $1 of USDC
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
  return createPublicClient({
    chain,
    transport: http(chain.rpcUrls.alchemy.http[0] + "/" + alchemyKey),
  });
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
