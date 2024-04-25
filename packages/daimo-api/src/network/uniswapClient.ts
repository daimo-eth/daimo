import {
  BigIntStr,
  ProposedSwap,
  now,
  ForeignCoin,
  nativeETH,
  EAccount,
  dollarsToAmount,
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

  async getProposedSwap(
    addr: Address,
    fromAmount: BigIntStr,
    fromCoin: ForeignCoin,
    receivedAt: number,
    fromAcc: EAccount
  ): Promise<ProposedSwap | null> {
    if (!this.router) return null;

    const options: SwapOptionsSwapRouter02 = {
      recipient: addr,
      slippageTolerance: new Percent(50, 10_000), // 50 bips
      deadline: Math.floor(now() + 1800),
      type: SwapType.SWAP_ROUTER_02,
    };

    const uniFromToken =
      fromCoin.token === "ETH"
        ? new NativeETH()
        : new Token(chainConfig.chainL2.id, fromCoin.token, fromCoin.decimals);

    const route = await this.router.route(
      CurrencyAmount.fromRawAmount(uniFromToken, fromAmount),
      this.uniHomeToken,
      TradeType.EXACT_INPUT,
      options
    );

    if (!route || !route.methodParameters) {
      console.log(
        `[UNISWAP] no route found for ${addr} ${JSON.stringify(
          fromCoin
        )}, amount ${fromAmount}`
      );
      return null;
    }

    return {
      fromCoin,
      fromAmount,
      fromAcc,
      receivedAt,
      toAmount: Number(dollarsToAmount(route.quote.toExact())),
      execRouterAddress: UNISWAP_V3_02_ROUTER_ADDRESS,
      execCallData: route.methodParameters.calldata as Hex,
      execValue: route.methodParameters.value as Hex,
    };
  }
}
