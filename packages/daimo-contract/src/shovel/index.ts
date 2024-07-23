import { makeConfig, toJSON } from "@indexsupply/shovel-config";
import type { Source } from "@indexsupply/shovel-config";
import { writeFileSync } from "fs";

import { keyAddedIntegration, keyRemovedIntegration } from "./keyRotation";
import { namesIntegration } from "./names";
import { noteCreatedIntegration, noteRedeemedIntegration } from "./notes";
import {
  requestCancelledIntegration,
  requestCreatedIntegration,
  requestFulfilledIntegration,
} from "./requests";
import { userOpIntegration } from "./userop";

// Note: config is Base on prod api, Base Sepolia on staging api
const source: Source = {
  name: "$BASE_CHAIN_NAME",
  chain_id: "$BASE_CHAIN_ID",
  ws_url: "$BASE_CHAIN_RPC_WS_URL",
  urls: ["$BASE_CHAIN_RPC_URL", "$BASE_CHAIN_RPC_URL_BACKUP"],
  batch_size: 100,
  concurrency: 4,
} as any; // TODO: remove once @indexsupply/shovel-config updates

const traceSource: Source = {
  name: "$BASE_CHAIN_TRACE_NAME",
  chain_id: "$BASE_CHAIN_ID",
  urls: ["$BASE_CHAIN_TRACE_RPC_URL", "$BASE_CHAIN_TRACE_RPC_URL_BACKUP"],
  batch_size: 32,
  concurrency: 2,
} as any;

const integrations = [
  namesIntegration,
  keyAddedIntegration,
  keyRemovedIntegration,
  noteCreatedIntegration,
  noteRedeemedIntegration,
  requestCreatedIntegration,
  requestCancelledIntegration,
  requestFulfilledIntegration,
  userOpIntegration,
];

const config = makeConfig({
  pg_url: "$DATABASE_URL",
  sources: [source, traceSource],
  integrations,
});

console.log(`✔ Writing Shovel config to shovel/config.json`);
writeFileSync("src/shovel/config.json", toJSON(config, 2));
