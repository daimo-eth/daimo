import {
  BigIntStr,
  ProposedSwap,
  now,
  ForeignCoin,
  nativeETH,
  EAccount,
  dollarsToAmount,
  assert,
} from "@daimo/common";
import {
  Currency,
  CurrencyAmount,
  NativeCurrency,
  Percent,
  Token,
  TradeType,
  WETH9,
} from "@uniswap/sdk-core";
import {
  AlphaRouter,
  SwapOptionsSwapRouter02,
  SwapType,
} from "@uniswap/smart-order-router";
import { getDefaultProvider } from "ethers";
import { Address, Hex, getAddress } from "viem";

import { chainConfig } from "../env";
import { retryBackoff } from "../utils/retryBackoff";

// From https://docs.uniswap.org/contracts/v3/reference/deployments/base-deployments
export const UNISWAP_V3_02_ROUTER_ADDRESS = getAddress(
  "0x2626664c2603336E57B271c5C0b26F421741e481"
);

class NativeETH extends NativeCurrency {
  public get wrapped(): Token {
    return WETH9[chainConfig.chainL2.id];
  }

  constructor() {
    super(
      chainConfig.chainL2.id,
      nativeETH.decimals,
      nativeETH.symbol,
      nativeETH.fullName
    );
  }

  public equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId;
  }
}

export class UniswapClient {
  private uniHomeToken = new Token(
    chainConfig.chainL2.id,
    chainConfig.tokenAddress,
    chainConfig.tokenDecimals
  );
  private router: AlphaRouter | null;
  private swapCache: Map<string, ProposedSwap> = new Map();

  constructor() {
    const l2_RPCs = process.env.DAIMO_API_L2_RPC_WS!.split(",");

    console.log(`[UNISWAP] using L2 RPCs: ${l2_RPCs}`);

    const provider = getDefaultProvider(l2_RPCs[0]) as any; // TODO: use fallbacks?

    if (chainConfig.chainL2.testnet) {
      // Base Sepolia is not supported by Uniswap yet -> we test in Prod.
      this.router = null;
    } else {
      this.router = new AlphaRouter({
        chainId: chainConfig.chainL2.id,
        provider,
      });
    }
  }

  swapCacheKey(
    addr: Address,
    fromAmount: BigIntStr,
    token: "ETH" | Address,
    receivedAt: number,
    fromAddr: Address
  ) {
    return `${addr}-${fromAmount}-${token}-${receivedAt}-${fromAddr}`;
  }

  cacheSwap(addr: Address, swap: ProposedSwap | null) {
    if (swap == null) return;
    const key = this.swapCacheKey(
      addr,
      swap.fromAmount,
      swap.fromCoin.token,
      swap.receivedAt,
      swap.fromAcc.addr
    );
    this.swapCache.set(key, swap);
  }

  getCachedSwap(
    addr: Address,
    fromAmount: BigIntStr,
    token: "ETH" | Address,
    receivedAt: number,
    fromAddr: Address
  ): ProposedSwap | undefined {
    const key = this.swapCacheKey(
      addr,
      fromAmount,
      token,
      receivedAt,
      fromAddr
    );
    return this.swapCache.get(key);
  }

  async fetchAndCacheSwap(
    addr: Address,
    fromAmount: BigIntStr,
    fromCoin: ForeignCoin,
    receivedAt: number,
    fromAcc: EAccount
  ) {
    assert(this.router != null, "Uniswap router not initialized");

    const startMs = Date.now();
    console.log(`[UNISWAP] fetching swap for ${addr} ${fromCoin.token}`);

    const t = now();
    const cacheUntil = t + 5 * 60; // 5 min
    const execDeadline = t + 10 * 60; // 10 min

    const options: SwapOptionsSwapRouter02 = {
      recipient: addr,
      slippageTolerance: new Percent(50, 10_000), // 50 bips
      deadline: execDeadline,
      type: SwapType.SWAP_ROUTER_02,
    };

    const uniFromToken =
      fromCoin.token === "ETH"
        ? new NativeETH()
        : new Token(chainConfig.chainL2.id, fromCoin.token, fromCoin.decimals);

    const route = await retryBackoff(
      `uniswap-router-${addr}-${fromCoin.token}`,
      async () =>
        await this.router!.route(
          CurrencyAmount.fromRawAmount(uniFromToken, fromAmount),
          this.uniHomeToken,
          TradeType.EXACT_INPUT,
          options
        )
    );

    if (!route || !route.methodParameters) {
      console.log(
        `[UNISWAP] no route found for ${addr} ${JSON.stringify(
          fromCoin
        )}, amount ${fromAmount}`
      );
      return null;
    }

    console.log(`[UNISWAP] found route ${JSON.stringify(route.route)}`);

    const swap: ProposedSwap = {
      fromCoin,
      fromAmount,
      fromAcc,
      receivedAt,
      cacheUntil,
      execDeadline,
      toAmount: Number(dollarsToAmount(route.quote.toExact())),
      execRouterAddress: UNISWAP_V3_02_ROUTER_ADDRESS,
      execCallData: route.methodParameters.calldata as Hex,
      execValue: route.methodParameters.value as Hex,
    };

    this.cacheSwap(addr, swap);

    console.log(
      `[UNISWAP] fetched and cached swap for ${addr} ${fromCoin.token} in ${
        Date.now() - startMs
      }ms`
    );
    return swap;
  }

  // Fetches swap data from Uniswap for foreign coins.
  // Uniswap is extremely slow, so we have a caching strategy:
  // - If runsInBackground, we fetch latest swap data in background, and
  //   currently return (possibly expired) cached swap. It's up to the caller
  //   in this case to refetch the latest swap data before using it.
  // - Otherwise, we fetch a new swap slowly, and return it.
  async getProposedSwap(
    addr: Address,
    fromAmount: BigIntStr,
    fromCoin: ForeignCoin,
    receivedAt: number,
    fromAcc: EAccount,
    runsInBackground?: boolean
  ): Promise<ProposedSwap | null> {
    const cachedSwap = this.getCachedSwap(
      addr,
      fromAmount,
      fromCoin.token,
      receivedAt,
      fromAcc.addr
    );

    if (cachedSwap && cachedSwap.cacheUntil > now()) {
      return cachedSwap;
    }

    const promise = this.fetchAndCacheSwap(
      addr,
      fromAmount,
      fromCoin,
      receivedAt,
      fromAcc
    );

    if (!runsInBackground) await promise;

    return (
      this.getCachedSwap(
        addr,
        fromAmount,
        fromCoin.token,
        receivedAt,
        fromAcc.addr
      ) || null
    );
  }
}
