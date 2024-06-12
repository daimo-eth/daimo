import {
  BigIntStr,
  EAccount,
  ForeignCoin,
  SwapQueryResult,
  assertNotNull,
  dollarsToAmount,
  nativeETH,
  now,
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
  SwapRoute,
  SwapType,
} from "@uniswap/smart-order-router";
import { getDefaultProvider } from "ethers";
import { Address, Hex, getAddress } from "viem";

import { chainConfig, getEnvApi } from "../env";
import { retryBackoff } from "../utils/retryBackoff";

// On Base
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
  private swapCache: Map<string, SwapQueryResult> = new Map();

  constructor() {
    if (chainConfig.chainL2.testnet) {
      // Base Sepolia is not supported by Uniswap yet -> we test in Prod.
      this.router = null;
      return;
    }

    const uniswapRPC = getEnvApi().DAIMO_API_UNISWAP_RPC;
    console.log(`[UNISWAP] using L2 RPC: '${uniswapRPC}'`);
    assertNotNull(uniswapRPC, "Set DAIMO_API_UNISWAP_RPC");
    const provider = getDefaultProvider(uniswapRPC) as any; // TODO: fallbacks?
    this.router = new AlphaRouter({
      chainId: chainConfig.chainL2.id,
      provider,
    });
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

  cacheSwap(addr: Address, swap: SwapQueryResult) {
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
  ): SwapQueryResult | undefined {
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
    if (this.router == null) {
      console.log(`[UNISWAP] skipping fetch, no router`);
      return null;
    }

    const startMs = Date.now();
    console.log(`[UNISWAP] fetching swap for ${addr} ${fromCoin.token}`);

    const t = now();
    const cacheUntil = t + 5 * 60; // 5 min
    const execDeadline = t + 10 * 60; // 10 min

    const route = await this.fetchRoute(
      fromCoin,
      fromAmount,
      addr,
      execDeadline
    );

    const elapsedMs = Date.now() - startMs;
    console.log(
      `[UNISWAP] fetched swap for ${addr}: ${fromAmount} ${fromCoin.symbol} ${fromCoin.token} in ${elapsedMs}ms`
    );

    const routeQuery = {
      fromCoin,
      fromAmount,
      fromAcc,
      receivedAt,
      cacheUntil,
      execDeadline,
      toCoin: this.uniHomeToken.address as Address,
    };

    const swap: SwapQueryResult =
      route && route.methodParameters
        ? {
            ...routeQuery,
            routeFound: true,
            toAmount: Number(dollarsToAmount(route.quote.toExact())),
            execRouterAddress: UNISWAP_V3_02_ROUTER_ADDRESS,
            execCallData: route.methodParameters.calldata as Hex,
            execValue: route.methodParameters.value as Hex,
          }
        : {
            ...routeQuery,
            routeFound: false,
          };

    this.cacheSwap(addr, swap);
    return swap;
  }

  // Fetches the best route for a given Uniswap swap.
  public async fetchRoute(
    fromCoin: ForeignCoin,
    fromAmount: BigIntStr,
    toAddr: Address,
    execDeadline: number
  ): Promise<SwapRoute | null> {
    const router = assertNotNull(this.router, "fetchRoute: no router");

    const options: SwapOptionsSwapRouter02 = {
      recipient: toAddr,
      slippageTolerance: new Percent(500, 10_000), // 500 bips = 5%
      deadline: execDeadline,
      type: SwapType.SWAP_ROUTER_02,
    };

    const uniFromToken =
      fromCoin.token === "ETH"
        ? new NativeETH()
        : new Token(chainConfig.chainL2.id, fromCoin.token, fromCoin.decimals);
    const from = CurrencyAmount.fromRawAmount(uniFromToken, fromAmount);
    const to = this.uniHomeToken;
    const toSymbol = this.uniHomeToken.symbol;

    const results = await retryBackoff(
      `uniswap-router-${toAddr}-${fromCoin.token}`,
      () =>
        Promise.all([
          router.route(from, to, TradeType.EXACT_INPUT),
          router.route(from, to, TradeType.EXACT_INPUT, options),
        ])
    );

    // There is a strange bug where Uniswap sometimes returns terrible routes.
    const quoteNoRoute = Number(results[0]?.quote.toExact());
    const quoteWithRoute = Number(results[1]?.quote.toExact());
    const quoteNoRouteStr = `${quoteNoRoute.toFixed(2)} ${toSymbol}`;
    const quoteWithRouteStr = `${quoteWithRoute.toFixed(2)} ${toSymbol}`;
    console.log(
      `[UNISWAP] ${fromAmount} ${fromCoin.symbol} quoteNoRoute ${quoteNoRouteStr} quoteWithRoute ${quoteWithRouteStr}`
    );

    const isLarge = quoteWithRoute > 100;
    const isDiscrepancy =
      Math.abs(quoteWithRoute - quoteNoRoute) / (quoteWithRoute + 1) > 0.05;
    if (isLarge || isDiscrepancy) {
      const desc = isDiscrepancy ? "BAD" : "LARGE";
      const js = JSON.stringify({ noRoute: results[0], withRoute: results[1] });
      console.warn(
        `[UNISWAP] ${desc} quote ${quoteWithRouteStr} vs ${quoteNoRouteStr}: ${js}`
      );
    }

    const route = results[1];
    const jsonRoute = JSON.stringify(route?.route);
    console.log(
      `[UNISWAP] best route to accept ${fromAmount} ${fromCoin.symbol}: ${jsonRoute}`
    );
    return route;
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
  ): Promise<SwapQueryResult | null> {
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
