import { Integration, Table } from "@indexsupply/shovel-config";

import { daimoRequestAddress } from "../generated";

const requestCreatedTable: Table = {
  name: "request_created",
  columns: [
    { name: "chain_id", type: "numeric" },
    { name: "block_num", type: "numeric" },
    { name: "block_hash", type: "bytea" },
    { name: "tx_idx", type: "numeric" },
    { name: "tx_hash", type: "bytea" },
    { name: "log_addr", type: "bytea" },

    { name: "id", type: "numeric" },
    { name: "recipient", type: "bytea" },
    { name: "creator", type: "bytea" },
    { name: "amount", type: "numeric" },
    { name: "metadata", type: "bytea" },
  ],
};

const requestCancelledTable: Table = {
  name: "request_cancelled",
  columns: [
    { name: "chain_id", type: "numeric" },
    { name: "block_num", type: "numeric" },
    { name: "block_hash", type: "bytea" },
    { name: "tx_idx", type: "numeric" },
    { name: "tx_hash", type: "bytea" },
    { name: "log_addr", type: "bytea" },

    { name: "id", type: "numeric" },
    { name: "canceller", type: "bytea" },
  ],
};

const requestFulfilledTable: Table = {
  name: "request_fulfilled",
  columns: [
    { name: "chain_id", type: "numeric" },
    { name: "block_num", type: "numeric" },
    { name: "block_hash", type: "bytea" },
    { name: "tx_idx", type: "numeric" },
    { name: "tx_hash", type: "bytea" },
    { name: "log_addr", type: "bytea" },

    { name: "id", type: "numeric" },
    { name: "fulfiller", type: "bytea" },
  ],
};

export const requestCreatedIntegration: Integration = {
  name: "request_created",
  enabled: true,
  sources: [{ name: "$CHAIN_NAME", start: "$CHAIN_START_BLOCK" }],
  table: requestCreatedTable,
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
      filter_arg: [daimoRequestAddress],
    },
  ],
  event: {
    name: "RequestCreated",
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "id",
        type: "uint256",
        column: "id",
      },
      {
        name: "recipient",
        type: "address",
        column: "recipient",
      },
      {
        name: "creator",
        type: "address",
        column: "creator",
      },
      {
        name: "amount",
        type: "uint256",
        column: "amount",
      },
      {
        name: "metadata",
        type: "bytes",
        column: "metadata",
      },
    ],
  },
};

export const requestCancelledIntegration: Integration = {
  name: "request_cancelled",
  enabled: true,
  sources: [{ name: "$CHAIN_NAME", start: "$CHAIN_START_BLOCK" }],
  table: requestCancelledTable,
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
      filter_arg: [daimoRequestAddress],
    },
  ],
  event: {
    name: "RequestCancelled",
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "id",
        type: "uint256",
        column: "id",
      },
      {
        name: "canceller",
        type: "address",
        column: "canceller",
      },
    ],
  },
};

export const requestFulfilledIntegration: Integration = {
  name: "request_fulfilled",
  enabled: true,
  sources: [{ name: "$CHAIN_NAME", start: "$CHAIN_START_BLOCK" }],
  table: requestFulfilledTable,
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
      filter_arg: [daimoRequestAddress],
    },
  ],
  event: {
    name: "RequestFulfilled",
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "id",
        type: "uint256",
        column: "id",
      },
      {
        name: "fulfiller",
        type: "address",
        column: "fulfiller",
      },
    ],
  },
};
