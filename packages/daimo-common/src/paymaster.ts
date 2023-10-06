export type ChainGasConstants = {
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;

  /* Estimated fee in dollars (2 digits after decimal) */
  estimatedFee: number;
};

export const DEFAULT_USEROP_VERIFICATION_GAS_LIMIT = 500000n;
export const DEFAULT_USEROP_CALL_GAS_LIMIT = 300000n;
