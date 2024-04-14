import { Integration, Table } from "@indexsupply/shovel-config";

import { notesV1AddressMap, notesV2AddressMap } from "../chainConfig";

const noteCreatedTable: Table = {
  name: "note_created",
  columns: [
    { name: "chain_id", type: "numeric" },
    { name: "block_num", type: "numeric" },
    { name: "block_hash", type: "bytea" },
    { name: "tx_idx", type: "numeric" },
    { name: "tx_hash", type: "bytea" },
    { name: "log_addr", type: "bytea" },

    { name: "ephemeral_owner", type: "bytea" },
    { name: "f", type: "bytea" },
    { name: "amount", type: "numeric" },
  ],
};

const noteRedeemedTable: Table = {
  name: "note_redeemed",
  columns: [
    { name: "chain_id", type: "numeric" },
    { name: "block_num", type: "numeric" },
    { name: "block_hash", type: "bytea" },
    { name: "tx_idx", type: "numeric" },
    { name: "tx_hash", type: "bytea" },
    { name: "log_addr", type: "bytea" },

    { name: "redeemer", type: "bytea" },
    { name: "ephemeral_owner", type: "bytea" },
    { name: "f", type: "bytea" },
    { name: "amount", type: "numeric" },
  ],
};

export const noteCreatedIntegration: Integration = {
  name: "note_created",
  enabled: true,
  sources: [{ name: "$CHAIN_NAME", start: "$CHAIN_START_BLOCK" }],
  table: noteCreatedTable,
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
      filter_arg: [
        ...notesV1AddressMap.values(),
        ...notesV2AddressMap.values(),
      ],
    },
  ],
  event: {
    name: "NoteCreated",
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "note",
        type: "tuple",
        components: [
          {
            name: "ephemeralOwner",
            type: "address",
            column: "ephemeral_owner",
          },
          { name: "from", type: "address", column: "f" },
          { name: "amount", type: "uint256", column: "amount" },
        ],
      },
    ],
  },
};

export const noteRedeemedIntegration: Integration = {
  name: "note_redeemed",
  enabled: true,
  sources: [{ name: "$CHAIN_NAME", start: "$CHAIN_START_BLOCK" }],
  table: noteRedeemedTable,
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
      filter_arg: [
        ...notesV1AddressMap.values(),
        ...notesV2AddressMap.values(),
      ],
    },
  ],
  event: {
    name: "NoteRedeemed",
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "note",
        type: "tuple",
        components: [
          {
            name: "ephemeralOwner",
            type: "address",
            column: "ephemeral_owner",
          },
          { name: "from", type: "address", column: "f" },
          { name: "amount", type: "uint256", column: "amount" },
        ],
      },
      {
        name: "redeemer",
        type: "address",
        column: "redeemer",
      },
    ],
  },
};
