import { Hex } from "viem";

export type ChainGasConstants = {
  paymasterAndData: Hex;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
};

export const DEFAULT_USEROP_VERIFICATION_GAS_LIMIT = 2000000n;
export const DEFAULT_USEROP_CALL_GAS_LIMIT = 1000000n;
export const DEFAULT_USEROP_PREVERIFICATION_GAS_LIMIT = 21000n;
