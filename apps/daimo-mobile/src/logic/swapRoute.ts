import { BigIntStr, ProposedSwap } from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import { Address } from "viem";

import { getRpcHook } from "./trpc";
import { Account, toEAccount } from "../storage/account";

// Get a swap route from on-chain contract.
export function getSwapRoute({
  fromToken,
  toToken,
  amountIn,
  fromAccount,
  toAddress,
  daimoChainId,
}: {
  fromToken: Address;
  toToken: Address;
  amountIn: bigint;
  fromAccount: Account;
  toAddress: Address;
  daimoChainId: number;
}) {
  const rpcHook = getRpcHook(daimoChainFromId(daimoChainId));

  const result = rpcHook.getSwapQuote.useQuery({
    amountIn: `${amountIn}` as BigIntStr,
    fromToken,
    toToken,
    fromAccount: toEAccount(fromAccount),
    toAddr: toAddress,
    chainId: daimoChainId,
  });

  const route = result.data as ProposedSwap | null;
  return route;
}
