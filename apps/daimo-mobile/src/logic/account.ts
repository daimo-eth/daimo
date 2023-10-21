import { chainConfig } from "@daimo/contract";
import { Address, Hex } from "viem";

import { Account } from "../model/account";

export function createEmptyAccount(inputAccount: {
  enclaveKeyName: string;
  enclavePubKey: Hex;
  name: string;
  address: Address;
}): Account {
  return {
    ...inputAccount,

    // No possibility of mismatch since API is locked to same chain
    homeChainId: chainConfig.chainL2.id,
    homeCoinAddress: chainConfig.tokenAddress,

    // These populate on sync with server
    lastBalance: BigInt(0),
    lastBlockTimestamp: 0,
    lastBlock: 0,
    lastFinalizedBlock: 0,

    namedAccounts: [],
    recentTransfers: [],
    trackedRequests: [],
    accountKeys: [],

    chainGasConstants: {
      maxPriorityFeePerGas: "0",
      maxFeePerGas: "0",
      estimatedFee: 0,
    },

    pushToken: null,
  };
}
