import { Integration, Table } from "@indexsupply/shovel-config";

import { daimoNameRegistryProxyAddress } from "../generated";

const table: Table = {
  name: "names",
  columns: [
    { name: "chain_id", type: "numeric" },
    { name: "block_num", type: "numeric" },
    { name: "block_hash", type: "bytea" },
    { name: "tx_idx", type: "numeric" },
    { name: "tx_hash", type: "bytea" },
    { name: "log_addr", type: "bytea" },
    { name: "name", type: "bytea" },
    { name: "addr", type: "bytea" },
  ],
};

export const namesIntegration: Integration = {
  name: "names",
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
      filter_op: "contains",
      filter_arg: [daimoNameRegistryProxyAddress],
    },
  ],
  event: {
    name: "Registered",
    type: "event",
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "name",
        type: "bytes32",
        column: "name",
      },
      {
        indexed: true,
        name: "addr",
        type: "address",
        column: "addr",
      },
    ],
  },
};
