import type {
  Integration,
  SourceReference,
  Table,
} from "@indexsupply/shovel-config";

import { ChainConfig, makeIntegrationSources } from "./chainConfig";

const table: Table = {
  name: "eth_transfers",
  columns: [
    { name: "chain_id", type: "numeric" },
    { name: "block_num", type: "numeric" },
    { name: "block_hash", type: "bytea" },
    { name: "tx_idx", type: "numeric" },
    { name: "tx_hash", type: "bytea" },
    { name: "call_type", type: "text" },
    { name: "f", type: "bytea" },
    { name: "t", type: "bytea" },
    { name: "v", type: "numeric" },
  ],
};

export function ethTransfersIntegration(chains: ChainConfig[]): Integration {
  const sources = makeIntegrationSources(chains, true); // use trace
  return {
    name: "eth_transfers",
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
        name: "trace_action_call_type",
        column: "call_type",
        filter_op: "eq",
        filter_arg: ["call"],
      },
      {
        name: "trace_action_from",
        column: "f",
      },
      {
        name: "trace_action_to",
        column: "t",
      },
      {
        name: "trace_action_value",
        column: "v",
        filter_op: "gt",
        filter_arg: ["0"],
      },
    ],
  } as any as Integration; // TODO: update shovel-config types
}
