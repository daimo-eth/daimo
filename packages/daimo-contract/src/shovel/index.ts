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
import { transfersIntegration } from "./transfers";
import { userOpIntegration } from "./userop";

const source: Source = {
  name: "$CHAIN_NAME",
  chain_id: "$CHAIN_ID",
  url: "$CHAIN_RPC_URL",
  batch_size: 100,
  concurrency: 4,
};

const integrations = [
  namesIntegration,
  keyAddedIntegration,
  keyRemovedIntegration,
  transfersIntegration,
  noteCreatedIntegration,
  noteRedeemedIntegration,
  requestCreatedIntegration,
  requestCancelledIntegration,
  requestFulfilledIntegration,
  userOpIntegration,
];

const config = makeConfig({
  pg_url: "$DATABASE_URL",
  sources: [source],
  integrations,
});

console.log(`✔ Writing Shovel config to config.json`);
writeFileSync("src/shovel/config.json", toJSON(config, 2));
