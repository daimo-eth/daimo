import fs from "node:fs/promises";
import {
  Address,
  createPublicClient,
  erc20Abi,
  getAddress,
  Hex,
  http,
  isAddress,
  MulticallResponse,
  parseUnits,
  zeroAddress,
} from "viem";

import {
  daimoFlexSwapperAddress,
  daimoPayBatchReadUtilsAbi,
  daimoPayBatchReadUtilsAddress,
  DAv2Chain,
  ethereum,
  getAlchemyTransportUrl,
  getDAv2Chain,
  getViemChainById,
  linea,
} from "../src";
import {
  baseUSDbC,
  baseUSDC,
  ForeignToken,
  getChainUSDC,
  lineaBridgedUSDC,
} from "../src/foreignToken";
// eslint-disable-next-line import/order
import { assert } from "./util";

const tokenListURLs = [
  "https://tokens.coingecko.com/ethereum/all.json",
  "https://tokens.coingecko.com/optimistic-ethereum/all.json",
  "https://tokens.coingecko.com/arbitrum-one/all.json",
  "https://tokens.coingecko.com/base/all.json",
  "https://tokens.coingecko.com/polygon-pos/all.json",
  // "https://tokens.coingecko.com/avalanche/all.json",
  "https://tokens.coingecko.com/linea/all.json",
  "https://tokens.coingecko.com/binance-smart-chain/all.json",
];

interface TokenListResponse {
  tokens: TokenListToken[];
  version: any;
}

interface TokenListToken {
  chainId: number;
  address: Hex;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
}

const alchemyApiKey = "";

/**
 * Generate a token list across all supported chains.
 */
async function main() {
  if (!alchemyApiKey) {
    console.error("ALCHEMY_API_KEY is not set. Set it in the script code.");
    process.exit(1);
  }

  console.log("Generating token list...");

  const foreignTokens: ForeignToken[] = [];
  for (const url of tokenListURLs) {
    // Add coins from token list
    const tokenList = (await fetchJson(url)) as TokenListResponse;
    const chain = getDAv2Chain(tokenList.tokens[0].chainId);
    assert(!chain.isTestnet, "Token lists used only for mainnet chains");

    const tokens = tokenList.tokens
      .map((token) => getForeignToken(chain, token))
      .filter((token) => token != null) as ForeignToken[];
    console.log(`Loaded ${tokens.length} tokens for ${chain.name} from ${url}`);

    const filteredErc20Tokens = await filterNonErc20(chain.chainId, tokens);
    const filteredLiquidityTokens = await filterLowLiquidity(
      chain.chainId,
      filteredErc20Tokens,
    );

    foreignTokens.push(...filteredLiquidityTokens);

    console.log(
      `Filtered out ${tokens.length - filteredErc20Tokens.length} non-ERC20 tokens on ${chain.name}`,
    );
    console.log(
      `Filtered out ${filteredErc20Tokens.length - filteredLiquidityTokens.length} low liquidity tokens on ${chain.name}`,
    );
    console.log(
      `Got ${filteredLiquidityTokens.length} validated tokens on ${chain.name}`,
    );
  }

  console.log(`Writing ${foreignTokens.length} tokens to tokens.json`);
  await fs.writeFile(
    "./src/codegen/tokens.json",
    JSON.stringify(foreignTokens, null, 2),
  );
}

async function fetchJson(url: string) {
  console.log(`Fetching ${url}`);
  const res = await fetch(url);
  return await res.json();
}

const customOverrides = [baseUSDC, baseUSDbC] as ForeignToken[];

function getForeignToken(
  chain: DAv2Chain,
  token: TokenListToken,
): ForeignToken | null {
  assert(
    token.chainId === chain.chainId,
    `Unsupported: ${JSON.stringify({ token, chain })}`,
  );
  const largeLogo = token.logoURI?.split("?")[0].replace("thumb", "large");

  // Ignore invalid addresses that Coingecko returns
  if (!isAddress(token.address)) return null;
  const addr = getAddress(token.address);

  const override = customOverrides.find(
    (o) => o.token === addr && o.chainId === chain.chainId,
  );
  if (override != null) {
    return override;
  } else {
    return {
      token: addr,
      decimals: token.decimals,
      name: token.name.trim().replace(/  */g, " "),
      symbol: token.symbol,
      logoURI: largeLogo,
      chainId: token.chainId,
    };
  }
}

/**
 * - Remove tokens whose contract does not implement the ERC20 interface.
 * - Remove tokens whose decimals on-chain don't match the decimals returned by
 * Coingecko.
 */
async function filterNonErc20(
  chainId: number,
  tokens: ForeignToken[],
): Promise<ForeignToken[]> {
  const client = createPublicClient({
    chain: getViemChainById(chainId),
    transport: http(getAlchemyTransportUrl(chainId, alchemyApiKey)),
  });

  const dummyEOA = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
  const dummySpender = "0xb7A593EC62dc447eef23ea0e0B4d5144ac75ABC5";

  const erc20ViewFunctions = (tokenAddress: Address) => [
    {
      abi: erc20Abi,
      address: tokenAddress,
      functionName: "name",
      args: [],
    },
    {
      abi: erc20Abi,
      address: tokenAddress,
      functionName: "symbol",
      args: [],
    },
    {
      abi: erc20Abi,
      address: tokenAddress,
      functionName: "decimals",
      args: [],
    },
    {
      abi: erc20Abi,
      address: tokenAddress,
      functionName: "totalSupply",
      args: [],
    },
    {
      abi: erc20Abi,
      address: tokenAddress,
      functionName: "balanceOf",
      args: [dummyEOA],
    },
    {
      abi: erc20Abi,
      address: tokenAddress,
      functionName: "allowance",
      args: [dummyEOA, dummySpender],
    },
  ];
  const n = erc20ViewFunctions(zeroAddress).length;

  // Check that all tokens implement basic ERC20 functions
  const multicallContracts = tokens.flatMap((token) =>
    erc20ViewFunctions(token.token),
  );

  const multicallResults = await client.multicall({
    contracts: multicallContracts,
    batchSize: 4096,
    allowFailure: true,
    multicallAddress: "0xcA11bde05977b3631167028862bE2a173976CA11",
  });

  const filteredTokens = tokens
    .map((token, index) => {
      const results = multicallResults.slice(index * n, (index + 1) * n) as [
        MulticallResponse<string, unknown, true>, // name
        MulticallResponse<string, unknown, true>, // symbol
        MulticallResponse<number, unknown, true>, // decimals
        MulticallResponse<bigint, unknown, true>, // totalSupply
        MulticallResponse<bigint, unknown, true>, // balanceOf
        MulticallResponse<bigint, unknown, true>, // allowance
      ];

      // If any of the calls were unsuccessful, filter the token out
      for (let i = 0; i < results.length; i++) {
        if (results[i].status !== "success") {
          return null;
        }
      }

      const decimals = results[2];
      if (token.decimals !== decimals.result) {
        return null;
      }

      return token;
    })
    .filter((out) => out != null);

  return filteredTokens;
}

/**
 * Remove tokens which don't have enough liquidity for a 10k USDC swap.
 */
async function filterLowLiquidity(
  chainId: number,
  tokens: ForeignToken[],
): Promise<ForeignToken[]> {
  // TODO: deploy to ethereum mainnet
  if (chainId === ethereum.chainId) return tokens;

  const client = createPublicClient({
    chain: getViemChainById(chainId),
    transport: http(getAlchemyTransportUrl(chainId, alchemyApiKey)),
  });

  const quoteToken =
    chainId === linea.chainId ? lineaBridgedUSDC : getChainUSDC(chainId);
  if (quoteToken == null) {
    throw new Error(`No USDC for chain ${chainId}`);
  }
  const quoteAmount = parseUnits("10000", quoteToken.decimals);
  const dfs = daimoFlexSwapperAddress(chainId);

  const quotes = await client.readContract({
    address: daimoPayBatchReadUtilsAddress,
    abi: daimoPayBatchReadUtilsAbi,
    functionName: "getQuotesBatch",
    args: [tokens.map((t) => t.token), quoteToken.token, quoteAmount, dfs],
  });

  // 0 means the token doesn't have enough liquidity
  return tokens.filter((_, i) => quotes[i] > 0);
}

main()
  .then(() => console.log("Done"))
  .catch((e) => console.error(e));
