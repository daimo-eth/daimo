import type { Integration, Table } from "@indexsupply/shovel-config";

import { ChainConfig, makeIntegrationSources } from "./chainConfig";
import { daimoFastCctpAddress } from "../generated";

const fastCctp: Table = {
  name: "fast_cctp",
  columns: [
    { name: "chain_id", type: "numeric" },
    { name: "block_num", type: "numeric" },
    { name: "block_hash", type: "bytea" },
    { name: "tx_idx", type: "numeric" },
    { name: "tx_hash", type: "bytea" },
    { name: "log_addr", type: "bytea" },

    // Shared across all FastCCTP events
    { name: "handoff_addr", type: "bytea" },
    { name: "from_chain_id", type: "numeric" },
    { name: "from_amount", type: "numeric" },
    { name: "to_addr", type: "bytea" },
    { name: "to_token", type: "bytea" },
    { name: "to_amount", type: "numeric" },
    { name: "nonce", type: "numeric" },

    // Nullable based on the event (used for filtering by event type)
    { name: "new_recipient", type: "bytea" }, // fastFinish
    { name: "final_recipient", type: "bytea" }, // claim
    { name: "from_addr", type: "bytea" }, // fastFinish or claim
    { name: "from_token", type: "bytea" }, // Start
    { name: "to_chain_id", type: "numeric" }, // Start
  ],
};

export function startCCTPIntegration(chains: ChainConfig[]): Integration {
  const sources = makeIntegrationSources(chains);
  return {
    name: "start_fast_cctp",
    enabled: true,
    sources,
    table: fastCctp,
    block: [
      { name: "chain_id", column: "chain_id" },
      { name: "block_num", column: "block_num" },
      { name: "block_hash", column: "block_hash" },
      { name: "tx_idx", column: "tx_idx" },
      { name: "tx_hash", column: "tx_hash" },
      {
        name: "log_addr",
        column: "log_addr",
        filter_arg: [daimoFastCctpAddress],
      },
    ],
    event: {
      name: "Start",
      type: "event",
      anonymous: false,
      inputs: [
        {
          name: "handoffAddr",
          type: "address",
          column: "handoff_addr",
          indexed: true,
        },
        {
          name: "fromToken",
          type: "address",
          column: "from_token",
        },
        {
          name: "fromAmount",
          type: "uint256",
          column: "from_amount",
        },
        {
          name: "toChainID",
          type: "uint256",
          column: "to_chain_id",
        },
        {
          name: "toAddr",
          type: "address",
          column: "to_addr",
        },
        {
          name: "toToken",
          type: "address",
          column: "to_token",
        },
        {
          name: "toAmount",
          type: "uint256",
          column: "to_amount",
        },
        {
          name: "nonce",
          type: "uint256",
          column: "nonce",
        },
      ],
    },
  };
}

export function fastFinishCCTPIntegration(chains: ChainConfig[]): Integration {
  const sources = makeIntegrationSources(chains);
  return {
    name: "fast_finish_cctp",
    enabled: true,
    sources,
    table: fastCctp,
    block: [
      { name: "chain_id", column: "chain_id" },
      { name: "block_num", column: "block_num" },
      { name: "block_hash", column: "block_hash" },
      { name: "tx_idx", column: "tx_idx" },
      { name: "tx_hash", column: "tx_hash" },
      {
        name: "log_addr",
        column: "log_addr",
        filter_arg: [daimoFastCctpAddress],
      },
    ],
    event: {
      name: "FastFinish",
      type: "event",
      anonymous: false,
      inputs: [
        {
          name: "handoffAddr",
          type: "address",
          column: "handoff_addr",
          indexed: true,
        },
        {
          name: "newRecipient",
          type: "address",
          column: "new_recipient",
          indexed: true,
        },
        {
          name: "fromChainID",
          type: "uint256",
          column: "from_chain_id",
        },
        {
          name: "fromAddr",
          type: "address",
          column: "from_addr",
        },
        {
          name: "fromAmount",
          type: "uint256",
          column: "from_amount",
        },
        {
          name: "toAddr",
          type: "address",
          column: "to_addr",
        },
        {
          name: "toToken",
          type: "address",
          column: "to_token",
        },
        {
          name: "toAmount",
          type: "uint256",
          column: "to_amount",
        },
        {
          name: "nonce",
          type: "uint256",
          column: "nonce",
        },
      ],
    },
  };
}

export function claimCCTPIntegration(chains: ChainConfig[]): Integration {
  const sources = makeIntegrationSources(chains);
  return {
    name: "claim_cctp",
    enabled: true,
    sources,
    table: fastCctp,
    block: [
      { name: "chain_id", column: "chain_id" },
      { name: "block_num", column: "block_num" },
      { name: "block_hash", column: "block_hash" },
      { name: "tx_idx", column: "tx_idx" },
      { name: "tx_hash", column: "tx_hash" },
      {
        name: "log_addr",
        column: "log_addr",
        filter_arg: [daimoFastCctpAddress],
      },
    ],
    event: {
      name: "Claim",
      type: "event",
      anonymous: false,
      inputs: [
        {
          name: "handoffAddr",
          type: "address",
          column: "handoff_addr",
          indexed: true,
        },
        {
          name: "finalRecipient",
          type: "address",
          column: "final_recipient",
          indexed: true,
        },
        {
          name: "fromChainID",
          type: "uint256",
          column: "from_chain_id",
        },
        {
          name: "fromAddr",
          type: "address",
          column: "from_addr",
        },
        {
          name: "fromAmount",
          type: "uint256",
          column: "from_amount",
        },
        {
          name: "toAddr",
          type: "address",
          column: "to_addr",
        },
        {
          name: "toToken",
          type: "address",
          column: "to_token",
        },
        {
          name: "toAmount",
          type: "uint256",
          column: "to_amount",
        },
        {
          name: "nonce",
          type: "uint256",
          column: "nonce",
        },
      ],
    },
  };
}
