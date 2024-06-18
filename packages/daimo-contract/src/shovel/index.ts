import { makeConfig, toJSON } from "@indexsupply/shovel-config";
import type { Source } from "@indexsupply/shovel-config";
import { writeFileSync } from "fs";

import { erc20TransfersIntegration } from "./erc20Transfers";
import { ethTransfersIntegration } from "./ethTransfers";
import { keyAddedIntegration, keyRemovedIntegration } from "./keyRotation";
import { namesIntegration } from "./names";
import { noteCreatedIntegration, noteRedeemedIntegration } from "./notes";
import {
  requestCancelledIntegration,
  requestCreatedIntegration,
  requestFulfilledIntegration,
} from "./requests";
import { transfersIntegration } from "./transfers";
import { userOpIntegration } from "./userop";

const source: Source = {
  name: "$CHAIN_NAME",
  chain_id: "$CHAIN_ID",
  ws_url: "$CHAIN_RPC_WS_URL",
  urls: ["$CHAIN_RPC_URL", "$CHAIN_RPC_URL_BACKUP"],
  batch_size: 100,
  concurrency: 4,
} as any; // TODO: remove once @indexsupply/shovel-config updates

const traceSource: Source = {
  name: "$CHAIN_TRACE_NAME",
  chain_id: "$CHAIN_ID",
  urls: ["$CHAIN_TRACE_RPC_URL", "$CHAIN_TRACE_RPC_URL_BACKUP"],
  batch_size: 128,
  concurrency: 8,
} as any;

const integrations = [
  namesIntegration,
  keyAddedIntegration,
  keyRemovedIntegration,
  transfersIntegration,
  erc20TransfersIntegration,
  ethTransfersIntegration,
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

console.log(`✔ Writing Shovel config to config.json`);
writeFileSync("src/shovel/config.json", toJSON(config, 2));
