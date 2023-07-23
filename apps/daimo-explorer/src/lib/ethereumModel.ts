import { Address, Hex } from "viem";

// Ethereum user op summary. JSON serializable.
export interface EOpSummary {
  blockTimestamp: number;
  op: EUserOp;
  // TODO: asset transfers, if any
  // TODO: tags (account creation, transfer, swap, ...)
}

// Ethereum user op.
export interface EUserOp {
  blockHash: Hex | null;
  blockNumber: number | null;
  chainID: number | null;
  contract: Hex | null;
  eth: string | null;
  logIndex: number | null;
  opActualGasCost: string | null;
  opActualGasUsed: string | null;
  opHash: Hex | null;
  opNonce: string | null;
  opPaymaster: Hex | null;
  opSender: Hex | null;
  opSuccess: boolean | null;
  txHash: Hex | null;
  txSender: Hex | null;
}

// Ethereum address summary.
export interface EAddrSummary {
  address: Address;
  // TODO: tags (paymaster, smart account, contract, EOA, ...)
  // TODO: list of chains this addr appears on
  // TODO: asset balances
  // TODO: recent ops
}
