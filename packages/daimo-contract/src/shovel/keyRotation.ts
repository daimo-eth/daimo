import { Integration, Table } from "@indexsupply/shovel-config";

const keyAddedTable: Table = {
  name: "key_added",
  columns: [
    { name: "chain_id", type: "numeric" },
    { name: "block_num", type: "numeric" },
    { name: "block_hash", type: "bytea" },
    { name: "tx_idx", type: "numeric" },
    { name: "tx_hash", type: "bytea" },
    { name: "log_addr", type: "bytea" },
    { name: "account", type: "bytea" },
    { name: "key_slot", type: "smallint" },
    { name: "key", type: "bytea" },
  ],
};

const keyRemovedTable: Table = {
  name: "key_removed",
  columns: [
    { name: "chain_id", type: "numeric" },
    { name: "block_num", type: "numeric" },
    { name: "block_hash", type: "bytea" },
    { name: "tx_idx", type: "numeric" },
    { name: "tx_hash", type: "bytea" },
    { name: "log_addr", type: "bytea" },
    { name: "account", type: "bytea" },
    { name: "key_slot", type: "smallint" },
    { name: "key", type: "bytea" },
  ],
};

export const keyAddedIntegration: Integration = {
  name: "key_added",
  enabled: true,
  sources: [{ name: "$CHAIN_NAME", start: "$CHAIN_START_BLOCK" }],
  table: keyAddedTable,
  block: [
    { name: "chain_id", column: "chain_id" },
    { name: "block_num", column: "block_num" },
    { name: "block_hash", column: "block_hash" },
    { name: "tx_idx", column: "tx_idx" },
    { name: "tx_hash", column: "tx_hash" },
    { name: "log_addr", column: "log_addr" },
  ],
  event: {
    name: "SigningKeyAdded",
    type: "event",
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "account",
        type: "address",
        column: "account",
      },
      {
        indexed: false,
        name: "keySlot",
        type: "uint8",
        column: "key_slot",
      },
      {
        indexed: false,
        name: "key",
        type: "bytes32[2]",
        column: "key",
      },
    ],
  },
};

export const keyRemovedIntegration: Integration = {
  name: "key_removed",
  enabled: true,
  sources: [{ name: "$CHAIN_NAME", start: "$CHAIN_START_BLOCK" }],
  table: keyRemovedTable,
  block: [
    { name: "chain_id", column: "chain_id" },
    { name: "block_num", column: "block_num" },
    { name: "block_hash", column: "block_hash" },
    { name: "tx_idx", column: "tx_idx" },
    { name: "tx_hash", column: "tx_hash" },
    { name: "log_addr", column: "log_addr" },
  ],
  event: {
    name: "SigningKeyRemoved",
    type: "event",
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "account",
        type: "address",
        column: "account",
      },
      {
        indexed: false,
        name: "keySlot",
        type: "uint8",
        column: "key_slot",
      },
      {
        indexed: false,
        name: "key",
        type: "bytes32[2]",
        column: "key",
      },
    ],
  },
};
