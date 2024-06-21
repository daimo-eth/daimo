import { ForeignToken, USDbC, assert, getChainName } from "@daimo/common";
import { Address, getAddress, isAddress, extractChain } from "viem";

import { chainConfig } from "../env";
import { fetchWithBackoff } from "../network/fetchWithBackoff";

interface TokenList {
  tokens: ForeignToken[];
  version: any;
}

// Token Registry sorted by chain id.
export class TokenRegistry {
  foreignTokensByChain: Map<number, Map<Address, ForeignToken>>;
  private chains: number[];
  private defaultChainId: number = chainConfig.chainL2.id;

  constructor(chains?: number[]) {
    this.foreignTokensByChain = new Map<number, Map<Address, ForeignToken>>();
    this.chains = chains ?? [this.defaultChainId]; // defaults to home chain
  }

  public async load() {
    const customOverrides = [USDbC] as ForeignToken[];

    for (const chainId of this.chains) {
      const chainName = getChainName(chainId);
      const foreignTokens = new Map<Address, ForeignToken>();

      const tokenList = (await (
        await fetchWithBackoff(
          `https://tokens.coingecko.com/${chainName}/all.json`
        )
      ).json()) as TokenList;

      for (const token of tokenList.tokens) {
        assert(
          token.chainId === chainConfig.chainL2.id,
          `Unsupported token on ${chainName}`
        );
        const largeLogo = token.logoURI
          ?.split("?")[0]
          .replace("thumb", "large");
        if (!isAddress(token.address)) continue; // ignore invalid addresses that Coingecko returns
        const addr = getAddress(token.address);
        if (addr === chainConfig.tokenAddress) continue;

        const override = customOverrides.find((o) => o.address === addr);
        if (override) foreignTokens.set(addr, override);
        else {
          foreignTokens.set(addr, {
            address: addr,
            decimals: token.decimals,
            name: token.name,
            symbol: token.symbol,
            logoURI: largeLogo,
            chainId: token.chainId,
          });
        }
      }
      console.log(
        `[TOKEN-REG] loaded ${foreignTokens.size} tokens on ${chainName}`
      );
      this.foreignTokensByChain.set(chainId, foreignTokens);
    }
  }

  public getToken(addr: Address, chainId?: number): ForeignToken | undefined {
    const tokenAddress = getAddress(addr);
    const token = this.foreignTokensByChain
      .get(chainId ?? this.defaultChainId)
      ?.get(tokenAddress);
    console.log(
      `[TOKEN-REG] retrieved token ${token?.symbol} for addr ${addr}`
    );
    return token;
  }

  public hasToken(addr: Address, chainId?: number): boolean {
    return (
      this.foreignTokensByChain
        .get(chainId ?? this.defaultChainId)
        ?.has(getAddress(addr)) ?? false
    );
  }

  public getTokenList(chainId: number): Map<Address, ForeignToken> {
    return this.foreignTokensByChain.get(chainId) ?? new Map();
  }
}
