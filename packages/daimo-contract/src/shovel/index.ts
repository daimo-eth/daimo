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

// Shovel only runs on Base / Base Sepolia
const sourceConfig: Source = {
  name: "$CHAIN_NAME",
  chain_id: "$CHAIN_ID",
  ws_url: `$BASE_ALCHEMY_WS_RPC`,
  urls: [`$BASE_ALCHEMY_RPC`, `$BASE_CHAINSTACK_RPC`],
  batch_size: 100,
  concurrency: 4,
} as any; // TODO: remove once @indexsupply/shovel-config updates

const traceSourceConfig: Source = {
  name: `$CHAIN_NAME_TRACE`,
  chain_id: `$CHAIN_ID`,
  urls: [`$BASE_CHAINSTACK_RPC`],
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
  pg_url: "$SHOVEL_DATABASE_URL",
  sources: [sourceConfig, traceSourceConfig],
  integrations,
});

console.log(`✔ Writing Shovel config to shovel/config.json`);
writeFileSync("src/shovel/config.json", toJSON(config, 2));
