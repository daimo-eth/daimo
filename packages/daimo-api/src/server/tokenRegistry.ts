import { getSupportedSendPairs } from "@daimo/common";
import {
  ForeignToken,
  base,
  getTokensForChain,
  isTestnetChain,
  polygon,
  ethereum,
  arbitrum,
  chainToForeignTokens,
} from "@daimo/contract";
import { Address, getAddress } from "viem";

import { chainConfig } from "../env";

/**
 * Token Registry sorted by chain id.
 */
export class TokenRegistry {
  /** Map of chainId to token address to foreign token type. */
  private foreignTokensByChain = new Map<number, Map<Address, ForeignToken>>();

  private defaultChainId = chainConfig.chainL2.id;

  // Load tokens for all chains
  public async load() {
    // If on testnet, only load native and CCTP tokens
    if (isTestnetChain(chainConfig.chainL2.id)) {
      chainToForeignTokens.forEach((tokens, chainId) => {
        const foreignTokens = new Map<Address, ForeignToken>();
        for (const token of tokens) {
          foreignTokens.set(token.token, token);
        }
        this.foreignTokensByChain.set(chainId, foreignTokens);
      });
      console.log(
        `[TOKEN-REG] loaded ${this.foreignTokensByChain.size} testnet tokens`
      );
    }

    // Otherwise, load tokens from generated registry
    const chainIds = [
      base.chainId,
      polygon.chainId,
      arbitrum.chainId,
      ethereum.chainId,
    ];
    for (const chainId of chainIds) {
      const foreignTokens = new Map<Address, ForeignToken>();
      const tokens = getTokensForChain(chainId);
      tokens.forEach((token) => {
        foreignTokens.set(token.token, token);
      });
      this.foreignTokensByChain.set(chainId, foreignTokens);
    }
    console.log(
      `[TOKEN-REG] loaded ${this.foreignTokensByChain.size} mainnet tokens`
    );
  }

  /**
   * Get a token from the foreign token list.
   */
  public getToken(addr: Address, chainId?: number): ForeignToken | undefined {
    const tokenAddress = getAddress(addr);
    const cid = chainId ?? this.defaultChainId;

    let token = this.foreignTokensByChain.get(cid)?.get(tokenAddress);

    // If not a foreign token, check if it's a home token.
    if (token == null) {
      const sendCoins = getSupportedSendPairs(cid).map((s) => s.coin);
      token = sendCoins.find((s) => s.chainId === cid && s.token === addr);
    }

    if (token == null) {
      console.log(`[TOKEN-REG] could not retrieve token for addr ${addr}`);
    }

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
