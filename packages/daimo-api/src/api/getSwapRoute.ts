import { BigIntStr, EAccount, ProposedSwap, assert, now } from "@daimo/common";
import {
  daimoFlexSwapperAbi,
  daimoFlexSwapperAddress,
  getDAv2Chain,
  swapRouter02Abi,
  swapRouter02Address,
} from "@daimo/contract";
import {
  Address,
  Hex,
  encodeFunctionData,
  numberToHex,
  zeroAddress,
} from "viem";

import { ViemClient } from "../network/viemClient";
import { TokenRegistry } from "../server/tokenRegistry";

// Direct path length is: 0x (1) + Token (20) + Fee (3) + Token (20) = 44 * 2.
const SINGLE_POOL_LENGTH_HEX = 88;

// Given an exact amount input of tokenIn, retrieve the best-effort swap path
// to get tokenOut.
export async function getSwapQuote({
  chainId,
  receivedAt,
  amountInStr,
  tokenIn,
  tokenOut,
  fromAccount,
  toAddr,
  vc,
  tokenReg,
}: {
  chainId: number;
  receivedAt: number;
  amountInStr: BigIntStr;
  tokenIn: Address;
  tokenOut: Address;
  fromAccount: EAccount;
  toAddr: Address;
  vc: ViemClient;
  tokenReg: TokenRegistry;
}) {
  // Swap quoter is not supported on testnet.
  const chain = getDAv2Chain(chainId);
  if (chain.isTestnet) return null;

  const amountIn: bigint = BigInt(amountInStr);
  assert(amountIn > 0, "amountIn must be positive");
  assert(tokenIn !== tokenOut, "tokenIn == tokenOut");

  // Special handling for native ETH
  const isFromETH = tokenIn === zeroAddress;
  const isToETH = tokenOut === zeroAddress;

  // Only quote known tokens (that appear on CoinGecko etc) to avoid spam.
  const fromCoin = tokenReg.getToken(tokenIn);
  const toCoin = tokenReg.getToken(tokenOut);
  if (fromCoin == null || toCoin == null) {
    console.log(`[SWAP QUOTE] no quote, unknown token: ${tokenIn} ${tokenOut}`);
    return null;
  }

  // Onchain Uniswap quoter.
  const swapQuote = await vc.publicClient.readContract({
    abi: daimoFlexSwapperAbi,
    address: daimoFlexSwapperAddress,
    functionName: "quote",
    args: [
      isFromETH ? chain.wrappedNativeToken.token : tokenIn,
      amountIn,
      isToETH ? chain.wrappedNativeToken.token : tokenOut,
    ],
  });
  const amountOut: bigint = swapQuote[0];
  const swapPath: Hex = swapQuote[1];

  // No output = no quote.
  if (amountOut === 0n) {
    console.log(
      `[SWAP QUOTE] no output for ${amountIn} ${fromCoin.symbol} ${tokenIn}: ${swapPath}`
    );
    return null;
  }

  // By default, the router holds the funds until the last swap, then it is
  // sent to the recipient. Special case: if outputToken is ETH, unwrap first.
  // Reference: https://github.com/Uniswap/sdks/blob/main/sdks/universal-router-sdk/src/entities/protocols/uniswap.ts
  const swapRecipient: Address = isToETH ? swapRouter02Address : toAddr;

  const t = now();
  const cacheUntil = t + 5 * 60; // 5 minutes
  const execDeadline = t + 10 * 60; // 10 minutes

  const maxSlippagePercent = 5n;
  const amountOutMinimum = amountOut - (maxSlippagePercent * amountOut) / 100n;

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
          recipient: swapRecipient,
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
          recipient: swapRecipient,
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
  if (isFromETH) {
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
  } else if (isToETH) {
    const unwrapETHCall = encodeFunctionData({
      abi: swapRouter02Abi,
      functionName: "unwrapWETH9",
      args: [0n, toAddr],
    });
    callData = encodeFunctionData({
      abi: swapRouter02Abi,
      functionName: "multicall",
      args: [[swapCallData, unwrapETHCall]],
    });
  } else {
    callData = swapCallData;
  }

  const swap: ProposedSwap = {
    fromCoin,
    fromAmount: `${amountIn}` as BigIntStr,
    fromAcc: fromAccount,
    receivedAt,
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
