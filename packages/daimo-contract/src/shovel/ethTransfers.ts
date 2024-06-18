import type { Integration, Table } from "@indexsupply/shovel-config";

const table: Table = {
  name: "eth_transfers",
  columns: [
    { name: "chain_id", type: "numeric" },
    { name: "block_num", type: "numeric" },
    { name: "block_hash", type: "bytea" },
    { name: "tx_idx", type: "numeric" },
    { name: "tx_hash", type: "bytea" },
    { name: "call_type", type: "text" },
    { name: "from", type: "bytea" },
    { name: "to", type: "bytea" },
    { name: "value", type: "numeric" },
  ],
};

export const ethTransfersIntegration = {
  name: "eth_transfers",
  enabled: false,
  sources: [{ name: "$CHAIN_TRACE_NAME", start: "$CHAIN_START_BLOCK" }],
  table,
  block: [
    { name: "chain_id", column: "chain_id" },
    { name: "block_num", column: "block_num" },
    { name: "block_hash", column: "block_hash" },
    { name: "tx_idx", column: "tx_idx" },
    { name: "tx_hash", column: "tx_hash" },
    {
      name: "trace_action_call_type",
      column: "call_type",
      filter_op: "eq",
      filter_arg: ["call"],
    },
    {
      name: "trace_action_from",
      column: "from",
    },
    {
      name: "trace_action_to",
      column: "to",
    },
    {
      name: "trace_action_value",
      column: "value",
      filter_op: "gt",
      filter_arg: ["0"],
    },
  ],
} as any as Integration; // TODO: update shovel-config types
