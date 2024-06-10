import { UNISWAP_V3_02_ROUTER_ADDRESS } from "@daimo/api/src/network/uniswapClient";
import { BigIntStr, ForeignCoin, ProposedSwap, now } from "@daimo/common";
import { DaimoChain, daimoChainFromId } from "@daimo/contract";
import { WETH9, validateAndParseAddress } from "@uniswap/sdk-core";
import { SwapRouter } from "@uniswap/universal-router-sdk";
import { ADDRESS_ZERO } from "@uniswap/v3-sdk";
import { Address, Hex, toHex } from "viem";

import { getRpcHook } from "./trpc";
import { Account, toEAccount } from "../model/account";

// Get a swap route from on-chain contract.
export function getSwapRoute({
  fromToken,
  toToken,
  amountIn,
  fromAccount,
  toAddress,
  daimoChainId,
}: {
  fromToken: ForeignCoin;
  toToken: ForeignCoin;
  amountIn: bigint;
  fromAccount: Account;
  toAddress: Address;
  daimoChainId: number;
}) {
  const rpcHook = getRpcHook(daimoChainFromId(daimoChainId));

  const result = rpcHook.getSwapQuote.useQuery({
    amountIn,
    fromToken: fromToken.token as Address,
    toToken: toToken.token as Address,
  });

  // A Uniswap swap path is constructed as follows: [fromToken, fee, toToken].
  // Reference: https://github.com/Uniswap/sdks/blob/main/sdks/v3-sdk/src/utils/encodeRouteToPath.ts
  const { amountOut, swapPath } = result.data as {
    amountOut: bigint;
    swapPath: Hex; // abi encoded
  };

  // By default, the router holds the funds until the last swap, then it is sent to the recipient.
  // Special case: if outputToken is native, then routerMustCustody is true.
  // Reference: https://github.com/Uniswap/sdks/blob/main/sdks/universal-router-sdk/src/entities/protocols/uniswap.ts
  const routerMustCustody = toToken.token === "ETH";
  const recipient = routerMustCustody
    ? ADDRESS_ZERO
    : validateAndParseAddress(toAddress);

  const exactInputParams = {
    path: swapPath,
    recipient,
    amountIn,
    amountOutMinimum: amountOut,
  };

  // Calldata reference:
  // https://github.com/Uniswap/sdks/blob/main/sdks/v3-sdk/src/swapRouter.ts
  const callData = SwapRouter.INTERFACE.encodeFunctionData("exactInput", [
    exactInputParams,
  ]);

  const t = now();
  const cacheUntil = t + 5 * 60; // 5 minutes
  const execDeadline = t + 10 * 60; // 10 minutes

  const toCoin =
    toToken.token === "ETH" ? WETH9[daimoChainId].address : toToken.token; // TODO: check WETH

  const swap: ProposedSwap | null = {
    fromCoin: fromToken,
    fromAmount: `${amountIn}` as BigIntStr,
    fromAcc: toEAccount(fromAccount),
    receivedAt: t,
    cacheUntil,
    toCoin: toCoin as Address,
    execDeadline,
    routeFound: true,
    toAmount: Number(amountOut),
    execRouterAddress: UNISWAP_V3_02_ROUTER_ADDRESS,
    execCallData: callData as Hex,
    execValue: toHex(0), // amount of native currency planned in the route
  };

  return swap;
}

// Get a swap route from Uniswap. Uniswap is slow, so we only use it for
// benchmarking and fallback.
export function getSwapRouteSlow({
  fromToken,
  toToken,
  amountIn,
  fromAccount,
  toAddress,
  daimoChain,
}: {
  fromToken: ForeignCoin;
  toToken: ForeignCoin;
  amountIn: bigint;
  fromAccount: Account;
  toAddress: string;
  daimoChain: DaimoChain;
}) {
  const rpcHook = getRpcHook(daimoChain);

  const result = rpcHook.getUniswapRoute.useQuery({
    fromToken: fromToken.token as Address,
    fromAmount: `${amountIn}` as BigIntStr,
    fromAccount: toEAccount(fromAccount),
    toToken: toToken.token as Address,
    toAddr: toAddress,
  });
  const route = result.data as ProposedSwap | null;
  return route;
}
