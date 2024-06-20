import {
  BigIntStr,
  baseUSDC,
  EAccount,
  now,
  ProposedSwap,
  getNativeETHByChain,
} from "@daimo/common";
import { daimoUsdcSwapperABI } from "@daimo/contract";
import { SwapRouter as SwapRouter02 } from "@uniswap/router-sdk";
import { ADDRESS_ZERO } from "@uniswap/v3-sdk";
import { Address, getAddress, Hex } from "viem";

import { ViemClient } from "../network/viemClient";
import { TokenRegistry } from "../server/tokenRegistry";

// Uniswap router on Base
// From https://docs.uniswap.org/contracts/v3/reference/deployments/base-deployments
export const UNISWAP_V3_02_ROUTER_ADDRESS = getAddress(
  "0x2626664c2603336E57B271c5C0b26F421741e481"
);

// Direct path length is: 0x (1) + Token (20) + Fee (3) + Token (20) = 44 * 2.
const SINGLE_POOL_LENGTH_HEX = 88;

// Given an exact amount input of tokenIn, retrieve the best-effort swap path
// to get tokenOut.
export async function getSwapQuote({
  amountInStr,
  tokenIn,
  tokenOut,
  fromAccount,
  toAddr,
  chainId,
  vc,
  tokenReg,
}: {
  amountInStr: BigIntStr;
  tokenIn: Address;
  tokenOut: Address;
  fromAccount: EAccount;
  toAddr: Address;
  chainId: number;
  vc: ViemClient;
  tokenReg: TokenRegistry;
}) {
  console.log("TOKEN REG: ", JSON.stringify(tokenReg.getTokenList()));

  const amountIn: bigint = BigInt(amountInStr);

  const swapQuote = await vc.publicClient.readContract({
    abi: daimoUsdcSwapperABI,
    address: "0x2F7e2Eee89A3c6937A22607c7e9B2231825a5418",
    functionName: "quote",
    args: [amountIn, tokenIn, tokenOut],
  });
  const amountOut: bigint = swapQuote[0];
  const swapPath: Hex = swapQuote[1];

  // By default, the router holds the funds until the last swap, then it is
  // sent to the recipient.
  // Special case: if outputToken is native, then routerMustCustody is true.
  // Reference: https://github.com/Uniswap/sdks/blob/main/sdks/universal-router-sdk/src/entities/protocols/uniswap.ts
  const routerMustCustody = tokenOut === getNativeETHByChain(chainId)?.address;
  const recipient: Address = routerMustCustody ? ADDRESS_ZERO : toAddr;

  const t = now();
  const cacheUntil = t + 5 * 60; // 5 minutes
  const execDeadline = t + 10 * 60; // 10 minutes

  const amountOutMinimum = amountOut - amountOut / 100n; // TODO: check amountOutMinimum

  let callData;
  if (pathIsDirectSwap(swapPath)) {
    const { tokenIn, fee, tokenOut } = decodeDirectPool(swapPath);

    const exactInputSingleParams = {
      tokenIn,
      tokenOut,
      fee,
      recipient,
      amountIn,
      amountOutMinimum,
      sqrtPriceLimitX96: 0,
    };
    callData = SwapRouter02.INTERFACE.encodeFunctionData("exactInputSingle", [
      exactInputSingleParams,
    ]);
  } else {
    const exactInputParams = {
      path: swapPath,
      recipient,
      amountIn,
      amountOutMinimum,
    };
    callData = SwapRouter02.INTERFACE.encodeFunctionData("exactInput", [
      exactInputParams,
    ]);
  }

  if (!callData) return null;

  let fromCoin;
  // TODO: in future, check home coin token using account (for now, baseUSDC)
  if (tokenIn === getAddress(baseUSDC.address)) {
    fromCoin = baseUSDC;
  } else {
    fromCoin = tokenReg.getToken(tokenIn); // Foreign tokens
  }

  if (!fromCoin) return null;

  const swap: ProposedSwap = {
    fromCoin,
    fromAmount: `${amountIn}` as BigIntStr,
    fromAcc: fromAccount,
    receivedAt: t,
    cacheUntil,
    execDeadline,
    toCoin: tokenOut,
    routeFound: true,
    toAmount: Number(amountOut),
    execRouterAddress: UNISWAP_V3_02_ROUTER_ADDRESS,
    execCallData: callData as Hex,
    execValue: "0x00" as Hex,
  };

  console.log("[SWAP QUOTE] swap quote: ", JSON.stringify(swap));
  return swap;
}

// Check if a swap path is a single swap (as opposed to a multi-hop swap).
function pathIsDirectSwap(swapPath: Hex): boolean {
  return swapPath.length === SINGLE_POOL_LENGTH_HEX;
}

// Uniswap pool.
type Pool = {
  tokenIn: Address;
  fee: number;
  tokenOut: Address;
};

// Decode a Uniswap V3 direct pool path in the form of [tokenIn, fee, tokenOut].
function decodeDirectPool(swapPath: Hex): Pool {
  return {
    tokenIn: `0x${swapPath.slice(2, 42)}` as Address,
    fee: parseInt(swapPath.slice(42, 48), 16),
    tokenOut: `0x${swapPath.slice(48, 88)}` as Address,
  };
}
