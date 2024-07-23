import { makeConfig, toJSON } from "@indexsupply/shovel-config";
import type { Source } from "@indexsupply/shovel-config";
import { writeFileSync } from "fs";

import { erc20TransfersIntegration } from "../shovelSquared/erc20Transfers";
import { ethTransfersIntegration } from "../shovelSquared/ethTransfers";
import {
  claimCCTPIntegration,
  fastFinishCCTPIntegration,
  startCCTPIntegration,
} from "../shovelSquared/fastCctp";

// Note: config is sepolia on staging api
const supportedChains = ["BASE", "OP", "ETH", "AVAX", "POLYGON", "ARBITRUM"];

const allSources: Source[] = [];
for (const chain of supportedChains) {
  const source: Source = {
    name: `$${chain}_CHAIN_NAME`,
    chain_id: `$${chain}_CHAIN_ID`,
    ws_url: `$${chain}_CHAIN_RPC_WS_URL`,
    urls: [`$${chain}_CHAIN_RPC_URL`, `$${chain}_CHAIN_RPC_URL_BACKUP`],
    batch_size: 100,
    concurrency: 4,
  } as any;

  const traceSource: Source = {
    name: `$${chain}_CHAIN_TRACE_NAME`,
    chain_id: `$${chain}_CHAIN_ID`,
    urls: [
      `$${chain}_CHAIN_TRACE_RPC_URL`,
      `$${chain}_CHAIN_TRACE_RPC_URL_BACKUP`,
    ],
    batch_size: 32,
    concurrency: 2,
  } as any;

  allSources.push(source, traceSource);
}

// Track all transfers and CCTP events on all chains
const integrations = [
  erc20TransfersIntegration,
  ethTransfersIntegration,
  startCCTPIntegration,
  fastFinishCCTPIntegration,
  claimCCTPIntegration,
];

const config = makeConfig({
  pg_url: "$SHOVEL_SQUARED_DATABASE_URL",
  sources: allSources,
  integrations,
});

console.log(`✔ Writing Shovel Squared config to shovelSquared/config.json`);
writeFileSync("src/shovelSquared/config.json", toJSON(config, 2));
