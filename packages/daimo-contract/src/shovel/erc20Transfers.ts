import type { Integration, Table } from "@indexsupply/shovel-config";

const table: Table = {
  name: "erc20_transfers",
  columns: [
    { name: "chain_id", type: "numeric" },
    { name: "block_num", type: "numeric" },
    { name: "block_hash", type: "bytea" },
    { name: "tx_idx", type: "numeric" },
    { name: "tx_hash", type: "bytea" },
    { name: "log_addr", type: "bytea" },
    { name: "f", type: "bytea" },
    { name: "t", type: "bytea" },
    { name: "v", type: "numeric" },
  ],
};

export const erc20TransfersIntegration: Integration = {
  name: "erc20_transfers",
  enabled: true,
  sources: [{ name: "$CHAIN_NAME", start: "$CHAIN_START_BLOCK" }],
  table,
  block: [
    { name: "chain_id", column: "chain_id" },
    { name: "block_num", column: "block_num" },
    { name: "block_hash", column: "block_hash" },
    { name: "tx_idx", column: "tx_idx" },
    { name: "tx_hash", column: "tx_hash" },
    {
      name: "log_addr",
      column: "log_addr",
    },
  ],
  event: {
    name: "Transfer",
    type: "event",
    anonymous: false,
    inputs: [
      { indexed: true, name: "from", type: "address", column: "f" },
      { indexed: true, name: "to", type: "address", column: "t" },
      {
        indexed: false,
        name: "value",
        type: "uint256",
        column: "v",
      },
    ],
  },
};
