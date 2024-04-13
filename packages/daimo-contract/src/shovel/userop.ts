import { Integration, Table } from "@indexsupply/shovel-config";
import { Constants } from "userop";
import { Address } from "viem";

const userOpTable: Table = {
  name: "erc4337_user_op",
  columns: [
    { name: "chain_id", type: "numeric" },
    { name: "block_num", type: "numeric" },
    { name: "block_hash", type: "bytea" },
    { name: "tx_idx", type: "numeric" },
    { name: "tx_hash", type: "bytea" },
    { name: "log_addr", type: "bytea" },

    { name: "op_hash", type: "bytea" },
    { name: "op_sender", type: "bytea" },
    { name: "op_paymaster", type: "bytea" },
    { name: "op_nonce", type: "numeric" },
    { name: "op_success", type: "bool" },
    { name: "op_actual_gas_cost", type: "numeric" },
    { name: "op_actual_gas_used", type: "numeric" },
  ],
};

export const userOpIntegration: Integration = {
  name: "erc4337_user_op",
  enabled: true,
  sources: [{ name: "$CHAIN_NAME", start: "$CHAIN_START_BLOCK" }],
  table: userOpTable,
  block: [
    { name: "chain_id", column: "chain_id" },
    { name: "block_num", column: "block_num" },
    { name: "block_hash", column: "block_hash" },
    { name: "tx_idx", column: "tx_idx" },
    { name: "tx_hash", column: "tx_hash" },
    {
      name: "log_addr",
      column: "log_addr",
      filter_op: "contains",
      filter_arg: [Constants.ERC4337.EntryPoint as Address],
    },
  ],
  event: {
    name: "UserOperationEvent",
    type: "event",
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "userOpHash",
        type: "bytes32",
        column: "op_hash",
      },
      {
        indexed: true,
        name: "sender",
        type: "address",
        column: "op_sender",
      },
      {
        indexed: true,
        name: "paymaster",
        type: "address",
        column: "op_paymaster",
      },
      {
        indexed: false,
        name: "nonce",
        type: "uint256",
        column: "op_nonce",
      },
      {
        indexed: false,
        name: "success",
        type: "bool",
        column: "op_success",
      },
      {
        indexed: false,
        name: "actualGasCost",
        type: "uint256",
        column: "op_actual_gas_cost",
      },
      {
        indexed: false,
        name: "actualGasUsed",
        type: "uint256",
        column: "op_actual_gas_used",
      },
    ],
  },
};
