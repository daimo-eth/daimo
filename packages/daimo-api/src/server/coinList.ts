import { ForeignCoin, assert, daimoDomainAddress } from "@daimo/common";
import { Address, getAddress } from "viem";

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

const customOverrides: Record<Address, ForeignToken> = {
  "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA": {
    token: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
    fullName: "Bridged USD Coin", // USDbC has a bad name on CoinGecko
    symbol: "USDbC",
    decimals: 6,
    logoURI: `${daimoDomainAddress}/assets/foreign-coin-logos/USDbC.png`, // CoinGecko logo is fugly
  },
};

export async function fetchTokenList(): Promise<Map<Address, ForeignToken>> {
  const tokenList = (await (
    await fetch("https://tokens.coingecko.com/base/all.json")
  ).json()) as TokenList;

  const ret: Map<Address, ForeignToken> = new Map();
  for (const token of tokenList.tokens) {
    assert(token.chainId === 8453, "Only Base supported");
    const largeLogo = token.logoURI?.split("?")[0].replace("thumb", "large");
    const addr = getAddress(token.address);
    if (addr === chainConfig.tokenAddress) continue;

    if (customOverrides[addr]) {
      ret.set(addr, customOverrides[addr]);
    } else {
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
