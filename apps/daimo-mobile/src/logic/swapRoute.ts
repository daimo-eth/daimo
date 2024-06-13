import { BigIntStr, ForeignCoin, ProposedSwap } from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import { Address } from "viem";

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
  toToken: Address;
  amountIn: bigint;
  fromAccount: Account;
  toAddress: Address;
  daimoChainId: number;
}) {
  const rpcHook = getRpcHook(daimoChainFromId(daimoChainId));

  const result = rpcHook.getSwapQuote.useQuery({
    amountIn: `${amountIn}` as BigIntStr,
    fromToken: fromToken.token as Address,
    toToken,
    fromAccount: toEAccount(fromAccount),
    toAddr: toAddress,
    chainId: daimoChainId,
  });

  const route = result.data as ProposedSwap | null;
  return route;
}
