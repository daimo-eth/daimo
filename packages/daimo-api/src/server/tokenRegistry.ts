import {
  ForeignToken,
  baseUSDbC,
  assert,
  getChainName,
  getSupportedHomeCoinByAddress,
  baseUSDC,
  getNativeETHForChain,
} from "@daimo/common";
import { Address, Hex, getAddress, isAddress } from "viem";

import { chainConfig } from "../env";
import { fetchWithBackoff } from "../network/fetchWithBackoff";

interface CoinGeckoResponse {
  tokens: CoinGeckoToken[];
  version: any;
}

interface CoinGeckoToken {
  chainId: number;
  address: Hex;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
}

const customOverrides = [baseUSDC, baseUSDbC] as ForeignToken[];

// Token Registry sorted by chain id.
export class TokenRegistry {
  private foreignTokensByChain = new Map<number, Map<Address, ForeignToken>>();

  private defaultChainId = chainConfig.chainL2.id;

  // No token registry on testnet
  private chains = chainConfig.chainL2.testnet ? [] : [this.defaultChainId];

  public async load() {
    for (const chainId of this.chains) {
      const chainName = getChainName(chainId);
      const foreignTokens = new Map<Address, ForeignToken>();

      // Add native ETH
      const nativeETH = getNativeETHForChain(chainId);
      if (nativeETH != null) foreignTokens.set(nativeETH.token, nativeETH);

      // Add coins from CoinGecko
      const tokenList = (await (
        await fetchWithBackoff(
          `https://tokens.coingecko.com/${chainName}/all.json`
        )
      ).json()) as CoinGeckoResponse;

      for (const token of tokenList.tokens) {
        assert(
          token.chainId === chainConfig.chainL2.id,
          `Unsupported token on ${chainName}`
        );
        const largeLogo = token.logoURI
          ?.split("?")[0]
          .replace("thumb", "large");
        // Ignore invalid addresses that Coingecko returns
        if (!isAddress(token.address)) continue;
        const addr = getAddress(token.address);

        // TODO: add known coins, including all supported stables
        // if (addr === chainConfig.tokenAddress) continue; // excude home coin

        const override = customOverrides.find(
          (o) => o.token === addr && o.chainId === chainId
        );
        if (override) foreignTokens.set(addr, override);
        else {
          foreignTokens.set(addr, {
            token: addr,
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

  // Get a token from the foreign token list.
  // If includeHomeCoin is true, include the home coin in the list.
  public getToken(
    addr: Address,
    chainId?: number,
    includeHomeCoin?: boolean
  ): ForeignToken | undefined {
    const tokenAddress = getAddress(addr);

    let token = this.foreignTokensByChain
      .get(chainId ?? this.defaultChainId)
      ?.get(tokenAddress);

    // If not a foreign token, check if it's a home token.
    if (includeHomeCoin && !token) {
      token = getSupportedHomeCoinByAddress(tokenAddress);
    }

    if (!token)
      console.log(`[TOKEN-REG] could not retrieve token for addr ${addr}`);

    return token;
  }

  // Check if a foreign token is tracked in the foreign token list.
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
