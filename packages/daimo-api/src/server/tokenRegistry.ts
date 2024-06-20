import { ForeignCoin, USDbC, assert, getHomeCoinToken } from "@daimo/common";
import { Address, getAddress, isAddress } from "viem";

import { chainConfig } from "../env";
import { fetchWithBackoff } from "../network/fetchWithBackoff";

// Exclude native ETH
export type ForeignToken = ForeignCoin & { token: Address };

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

// TODO: in the future, load a token registry for each chain.
export class TokenRegistry {
  foreignTokens: Map<Address, ForeignToken>;
  private chainName: string;

  constructor() {
    this.foreignTokens = new Map<Address, ForeignToken>();
    this.chainName = chainConfig.chainL2.name.toLowerCase();
  }

  public async load() {
    const customOverrides = [USDbC] as ForeignToken[];

    const tokenList = (await (
      await fetchWithBackoff(
        `https://tokens.coingecko.com/${this.chainName}/all.json`
      )
    ).json()) as TokenList;

    for (const token of tokenList.tokens) {
      assert(
        token.chainId === chainConfig.chainL2.id,
        `Unsupported token on ${this.chainName}`
      );
      const largeLogo = token.logoURI?.split("?")[0].replace("thumb", "large");
      if (!isAddress(token.address)) continue; // ignore invalid addresses that Coingecko returns
      const addr = getAddress(token.address);
      if (addr === chainConfig.tokenAddress) continue;

      const override = customOverrides.find((o) => o.token === addr);
      if (override) this.foreignTokens.set(addr, override);
      else {
        this.foreignTokens.set(addr, {
          token: addr,
          decimals: token.decimals,
          fullName: token.name,
          symbol: token.symbol,
          logoURI: largeLogo,
        });
      }
    }

    console.log(
      `[TOKEN-REG] loaded ${this.foreignTokens.size} tokens on ${this.chainName}`
    );
  }

  // Note: foreign tokens list doesn't include homecoin by default
  // for indexing purposes.
  public getToken(
    addr: Address,
    includeHomeCoin?: boolean
  ): ForeignToken | undefined {
    const tokenAddress = getAddress(addr);
    if (includeHomeCoin && tokenAddress === chainConfig.tokenAddress) {
      return getHomeCoinToken(tokenAddress);
    }

    const token = this.foreignTokens.get(addr);
    console.log(
      `[TOKEN-REG] retrieved token ${token?.symbol} for addr ${addr}`
    );
    return token;
  }

  public hasToken(addr: Address): boolean {
    return this.foreignTokens.has(addr);
  }

  public getTokenList(): Map<Address, ForeignToken> {
    return this.foreignTokens;
  }
}
