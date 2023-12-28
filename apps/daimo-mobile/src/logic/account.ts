import { DaimoChain, daimoPaymasterV2Address } from "@daimo/contract";
import { Address, Hex } from "viem";

import { env } from "./env";
import { Account } from "../model/account";

export function createEmptyAccount(
  inputAccount: {
    enclaveKeyName: string;
    enclavePubKey: Hex;
    name: string;
    address: Address;
  },
  daimoChain: DaimoChain
): Account {
  return {
    ...inputAccount,

    homeChainId: env(daimoChain).chainConfig.chainL2.id,
    homeCoinAddress: env(daimoChain).chainConfig.tokenAddress,

    lastBalance: BigInt(0),
    lastBlockTimestamp: 0,
    lastBlock: 0,
    lastFinalizedBlock: 0,

    namedAccounts: [],
    recentTransfers: [],
    trackedRequests: [],
    accountKeys: [],
    pendingKeyRotation: [],
    recommendedExchanges: [],
    suggestedActions: [],
    dismissedActionIDs: [],

    chainGasConstants: {
      maxPriorityFeePerGas: "0",
      maxFeePerGas: "0",
      estimatedFee: 0,
      paymasterAddress: daimoPaymasterV2Address,
      preVerificationGas: "0",
    },

    pushToken: null,
  };
}
