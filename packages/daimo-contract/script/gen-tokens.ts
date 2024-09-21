import fs from "node:fs/promises";
import { getAddress, Hex, isAddress } from "viem";

import { assert } from "./util";
import { DAv2Chain, getDAv2Chain } from "../src";
import { baseUSDbC, baseUSDC, ForeignToken } from "../src/foreignToken";

const tokenListURLs = [
  "https://tokens.coingecko.com/ethereum/all.json",
  "https://tokens.coingecko.com/optimistic-ethereum/all.json",
  "https://tokens.coingecko.com/arbitrum-one/all.json",
  "https://tokens.coingecko.com/base/all.json",
  "https://tokens.coingecko.com/polygon-pos/all.json",
  // "https://tokens.coingecko.com/avalanche/all.json",
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

/**
 * Generate a token list across all supported chains.
 */
async function main() {
  console.log("Generating token list...");

  const foreignTokens: ForeignToken[] = [];
  for (const url of tokenListURLs) {
    // Add coins from token list
    const tokenList = (await fetchJson(url)) as TokenListResponse;
    const chain = getDAv2Chain(tokenList.tokens[0].chainId);
    assert(!chain.isTestnet, "Token lists used only for mainnet chains");

    const tokens = tokenList.tokens
      .map((token) => getForeignToken(chain, token))
      .filter((token) => token != null);
    console.log(`Loaded ${tokens.length} tokens for ${chain.name} from ${url}`);

    foreignTokens.push(...tokens);
  }

  console.log(`Writing ${foreignTokens.length} tokens to tokens.json`);
  await fs.writeFile(
    "./src/codegen/tokens.json",
    JSON.stringify(foreignTokens, null, 2)
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
  token: TokenListToken
): ForeignToken | null {
  assert(
    token.chainId === chain.chainId,
    `Unsupported: ${JSON.stringify({ token, chain })}`
  );
  const largeLogo = token.logoURI?.split("?")[0].replace("thumb", "large");

  // Ignore invalid addresses that Coingecko returns
  if (!isAddress(token.address)) return null;
  const addr = getAddress(token.address);

  const override = customOverrides.find(
    (o) => o.token === addr && o.chainId === chain.chainId
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

main()
  .then(() => console.log("Done"))
  .catch((e) => console.error(e));
