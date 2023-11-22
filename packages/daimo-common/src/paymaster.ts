import { Hex } from "viem";

export type ChainGasConstants = {
  /** EIP-1559 max fee */
  maxFeePerGas: string;

  /** EIP-1559 max priority fee */
  maxPriorityFeePerGas: string;

  /* Primary cost on L2 - a large, fake # representing L1 data costs.  */
  preVerificationGas: string;

  /* Estimated fee in dollars (2 digits after decimal) */
  estimatedFee: number;

  /* Actually paymasterAndData, named for for <=1.3.5 backcompat. */
  paymasterAddress: Hex;
};

export const DEFAULT_USEROP_VERIFICATION_GAS_LIMIT = 700000n;
export const DEFAULT_USEROP_CALL_GAS_LIMIT = 300000n;
