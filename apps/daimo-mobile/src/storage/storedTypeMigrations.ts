import { BigIntStr, OpStatus, ProposedSwap } from "@daimo/common";
import { Address, Hex } from "viem";

import {
  StoredV15DaimoRequestV2Status,
  StoredV15EAccount,
  StoredV15PaymentLinkClog,
  StoredV16Clog,
} from "./storedTypes";

//
// Old, archived versions of stored types used inside of StoredModels.
// Do not edit these types. See storedAccountMigrations.
//

export type StoredV15Clog = StoredV15TransferClog | StoredV15PaymentLinkClog;

export interface StoredV15TransferClog {
  timestamp: number;
  status: OpStatus;
  opHash?: Hex;
  txHash?: Hex;
  blockNumber?: number;
  blockHash?: string;
  logIndex?: number;
  feeAmount?: number;
  type: "transfer";
  from: Address;
  to: Address;
  amount: number;
  nonceMetadata?: Hex;
  requestStatus?: StoredV15DaimoRequestV2Status;
  memo?: string;
  preSwapTransfer?: {
    coin: StoredV15ForeignCoin;
    amount: BigIntStr;
    from: Address;
  };
}

export interface StoredV15ProposedSwap {
  fromCoin: StoredV15ForeignCoin;
  fromAmount: BigIntStr;
  fromAcc: StoredV15EAccount;
  receivedAt: number;
  cacheUntil: number;
  toCoin: Address;
  execDeadline: number;
  routeFound: true;
  toAmount: number;
  execRouterAddress: Address;
  execCallData: Hex;
  execValue: Hex;
}

interface StoredV15ForeignCoin {
  chainId: number;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;

  // Due to a migration issue, AccountV15 proposedSwap coins may contain "token"
  // or "address". We resolve this issue in the migration to V16.
  token?: Address;
  address?: Address;
}

export function migrateV15Clog(clog: StoredV15Clog): StoredV16Clog {
  if (clog.type === "transfer" && clog.preSwapTransfer) {
    // if preSwapTransfer is present for V15, the clog is an inbound swap.s
    const { coin, amount, from } = clog.preSwapTransfer;
    const tokenAddress = coin.address || coin.token;
    if (tokenAddress == null) {
      return { ...clog, preSwapTransfer: undefined };
    }
    return {
      ...clog,
      preSwapTransfer: {
        coin: {
          chainId: coin.chainId,
          decimals: coin.decimals,
          symbol: coin.symbol,
          logoURI: coin.logoURI,
          token: tokenAddress,
        },
        amount,
        from,
      },
    };
  } else {
    return clog as StoredV16Clog;
  }
}

export function migrateV15ProposedSwaps(swaps: StoredV15ProposedSwap[]) {
  return (swaps || [])
    .map(migrateV15ProposedSwap)
    .filter((s) => s != null) as ProposedSwap[];
}

function migrateV15ProposedSwap(
  swap: StoredV15ProposedSwap
): ProposedSwap | undefined {
  const { fromCoin } = swap;
  const tokenAddress = fromCoin.address || fromCoin.token;
  if (!tokenAddress) return undefined;
  return {
    ...swap,
    fromCoin: {
      token: tokenAddress,
      chainId: fromCoin.chainId,
      decimals: fromCoin.decimals,
      name: fromCoin.name,
      symbol: fromCoin.symbol,
      logoURI: fromCoin.logoURI,
    },
  };
}
