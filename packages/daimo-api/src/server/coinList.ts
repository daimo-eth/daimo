import { ForeignCoin, USDbC, assert } from "@daimo/common";
import { Address, getAddress, isAddress } from "viem";

import { chainConfig } from "../env";

type TokenList = {
  tokens: {
    chainId: number;
    address: Address;
    name: string;
    symbol: string;
    decimals: number;
    logoURI?: string;
  }[];
  version: any;
};

// Exclude native ETH
export type ForeignToken = ForeignCoin & { token: Address };

const customOverrides = [USDbC] as ForeignToken[];

export async function fetchTokenList(): Promise<Map<Address, ForeignToken>> {
  const tokenList = (await (
    await fetch("https://tokens.coingecko.com/base/all.json")
  ).json()) as TokenList;

  const ret: Map<Address, ForeignToken> = new Map();
  for (const token of tokenList.tokens) {
    assert(token.chainId === 8453, "Only Base supported");
    const largeLogo = token.logoURI?.split("?")[0].replace("thumb", "large");
    if (!isAddress(token.address)) continue; // ignore invalid addresses that Coingecko returns
    const addr = getAddress(token.address);
    if (addr === chainConfig.tokenAddress) continue;

    const override = customOverrides.find((o) => o.token === addr);
    if (override) ret.set(addr, override);
    else {
      ret.set(addr, {
        token: addr,
        decimals: token.decimals,
        fullName: token.name,
        symbol: token.symbol,
        logoURI: largeLogo,
      });
    }
  }

  return ret;
}
