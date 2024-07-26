import type { Integration, Table } from "@indexsupply/shovel-config";

import { ChainConfig, makeIntegrationSources } from "./chainConfig";
import { daimoAccountFactoryV2Address } from "../generated";

const table: Table = {
  name: "daimo_addr_reg",
  columns: [
    { name: "addr", type: "bytea" },
    { name: "block_hash", type: "bytea" },
    { name: "block_num", type: "numeric" },
    { name: "chain_id", type: "numeric" },
    { name: "tx_idx", type: "numeric" },
    { name: "tx_hash", type: "bytea" },
    { name: "log_addr", type: "bytea" },
    { name: "log_idx", type: "numeric" },
    { name: "name", type: "text" },
    { name: "version", type: "numeric" }, // 1 for DAv1, 2 for DAv2

    // DAv2 account details (all null if not DAv2)
    { name: "home_chain_id", type: "numeric" },
    { name: "home_coin", type: "bytea" },
    { name: "swapper", type: "bytea" },
    { name: "bridger", type: "bytea" },
    { name: "keyslot", type: "bytea" },
    { name: "key", type: "bytea" },
    { name: "salt", type: "bytea" },
  ],
};

export function daimoAccV2Integration(chains: ChainConfig[]): Integration {
  const sources = makeIntegrationSources(chains);
  return {
    name: "daimo_addr_reg",
    enabled: true,
    sources,
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
        filter_arg: [daimoAccountFactoryV2Address],
      },
    ],
    event: {
      name: "CreateAccount",
      type: "event",
      anonymous: false,
      inputs: [
        {
          name: "account",
          type: "address",
          column: "addr",
          indexed: true,
        },
        {
          name: "homeChain",
          type: "uint256",
          column: "home_chain_id",
        },
        {
          name: "homeCoin",
          type: "address",
          column: "home_coin",
        },
        {
          name: "swapper",
          type: "address",
          column: "swapper",
        },
        {
          name: "bridger",
          type: "address",
          column: "bridger",
        },
        {
          name: "keyslot",
          type: "uint8",
          column: "keyslot",
        },
        {
          name: "key",
          type: "bytes32[2]",
          column: "key",
        },
        {
          name: "salt",
          type: "uint256",
          column: "salt",
        },
      ],
    },
  };
}
