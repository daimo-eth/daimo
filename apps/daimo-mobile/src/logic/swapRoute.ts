import { assert, BigIntStr, ProposedSwap } from "@daimo/common";
import { daimoChainFromId, ForeignToken } from "@daimo/contract";
import { Address } from "viem";

import { getRpcHook } from "./trpc";
import { Account, toEAccount } from "../storage/account";

// Get a swap route from on-chain contract.
export function useSwapRoute({
  fromAccount,
  fromCoin,
  toAddress,
  toCoin,
  amountIn,
}: {
  fromAccount: Account;
  fromCoin: ForeignToken;
  toAddress: Address;
  toCoin: ForeignToken;
  amountIn: bigint;
}) {
  const chainId = fromAccount.homeChainId;
  assert(chainId === fromCoin.chainId, "fromCoin chain mismatch");

  const isBridge = toCoin.chainId !== chainId;
  const isSwap = !isBridge && fromCoin.token !== toCoin.token;

  const rpcHook = getRpcHook(daimoChainFromId(chainId));
  const result = rpcHook.getSwapQuote.useQuery(
    {
      amountIn: `${amountIn}` as BigIntStr,
      fromToken: fromCoin.token,
      toToken: toCoin.token,
      fromAccount: toEAccount(fromAccount),
      toAddr: toAddress,
      chainId,
    },
    {
      enabled: isSwap,
    }
  );

  if (!isSwap) return null;
  return result.data as ProposedSwap | null;
}
