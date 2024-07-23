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
import {
  alchemyRpc,
  chainstackRpc,
  quicknodeRpc,
  shovelSourceName,
  shovelSources,
} from "../shovelConfig";

const sourceConfig: Source = {
  name: shovelSourceName,
  chain_id: shovelSources[shovelSourceName].chainId,
  ws_url: `wss://${alchemyRpc(shovelSourceName)}`,
  urls: [
    `https://${alchemyRpc(shovelSourceName)}`,
    `https://${quicknodeRpc(shovelSourceName)}`,
  ],
  batch_size: 100,
  concurrency: 4,
} as any; // TODO: remove once @indexsupply/shovel-config updates

const traceSourceConfig: Source = {
  name: `${shovelSourceName}Trace`,
  chain_id: shovelSources[shovelSourceName].chainId,
  urls: [`https://${chainstackRpc(shovelSourceName)}`],
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
