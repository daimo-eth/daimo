import {
  BigIntStr,
  EAccount,
  ProposedSwap,
  assert,
  isNativeETH,
  isTestnetChain,
  now,
} from "@daimo/common";
import {
  daimoUsdcSwapperABI,
  swapRouter02Abi,
  swapRouter02Address,
} from "@daimo/contract";
import { Address, Hex, encodeFunctionData, numberToHex } from "viem";

import { ViemClient } from "../network/viemClient";
import { TokenRegistry } from "../server/tokenRegistry";

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
  // Swap quoter is not supported on testnet.
  if (isTestnetChain(chainId)) return null;

  const amountIn: bigint = BigInt(amountInStr);
  assert(amountIn > 0, "amountIn must be positive");
  assert(tokenIn !== tokenOut, "tokenIn == tokenOut");

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
  // TODO: re-enable to support native ETH sends
  // const routerMustCustody = tokenOut === getNativeWETHByChain(chainId)?.token;
  // const recipient: Address = routerMustCustody ? zeroAddr : toAddr;
  const recipient = toAddr;

  const t = now();
  const cacheUntil = t + 5 * 60; // 5 minutes
  const execDeadline = t + 10 * 60; // 10 minutes

  const amountOutMinimum = amountOut - amountOut / 100n; // max slippage: 1%

  // Special handling for fromCoin = native ETH
  const fromCoin = tokenReg.getToken(tokenIn);
  if (fromCoin == null) return null;
  const isFromETH = isNativeETH(fromCoin, chainId);

  let swapCallData;
  if (pathIsDirectSwap(swapPath)) {
    const { tokenIn, fee, tokenOut } = decodeDirectPool(swapPath);
    swapCallData = encodeFunctionData({
      abi: swapRouter02Abi,
      functionName: "exactInputSingle",
      args: [
        {
          tokenIn,
          tokenOut,
          fee,
          recipient,
          // amountIn 0 = use router's balance. When swapping from ETH, we wrap
          // msg.value using wrapETH, giving the router a WETH balance.
          amountIn: isFromETH ? 0n : amountIn,
          amountOutMinimum,
          sqrtPriceLimitX96: 0n,
        },
      ],
    });
  } else {
    swapCallData = encodeFunctionData({
      abi: swapRouter02Abi,
      functionName: "exactInput",
      args: [
        {
          path: swapPath,
          recipient,
          amountIn: isFromETH ? 0n : amountIn,
          amountOutMinimum,
        },
      ],
    });
  }
  assert(swapCallData.length > 0);

  // If swapping native ETH: pass it, wrap it, then swap from WETH
  let execValue = 0n;
  let callData;
  if (isNativeETH(fromCoin, chainId)) {
    execValue = amountIn;
    const wrapETHCall = encodeFunctionData({
      abi: swapRouter02Abi,
      functionName: "wrapETH",
      args: [amountIn],
    });
    callData = encodeFunctionData({
      abi: swapRouter02Abi,
      functionName: "multicall",
      args: [[wrapETHCall, swapCallData]],
    });
  } else {
    callData = swapCallData;
  }
  // TODO: unwrap weth if toCoin = native ETH

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
    execRouterAddress: swapRouter02Address,
    execCallData: callData as Hex,
    execValue: numberToHex(execValue),
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
