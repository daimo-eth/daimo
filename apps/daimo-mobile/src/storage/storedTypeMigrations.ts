import { BigIntStr, OpStatus } from "@daimo/common";
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
}

export function migrateV15Clog(clog: StoredV15Clog): StoredV16Clog {
  if (clog.type === "transfer" && clog.preSwapTransfer) {
    // Remove old preSwapTransfers missing token addresses.
    // This is fixed on the next sync.
    return {
      ...clog,
      preSwapTransfer: undefined,
    };
  } else {
    return clog as StoredV16Clog;
  }
}
