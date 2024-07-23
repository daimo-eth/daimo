import { makeConfig, toJSON } from "@indexsupply/shovel-config";
import type { Source } from "@indexsupply/shovel-config";
import { writeFileSync } from "fs";

import {
  alchemyRpc,
  chainstackRpc,
  quicknodeRpc,
  ShovelSource,
  shovelSquaredSourceNames,
  shovelSources,
} from "../shovelConfig";
import { erc20TransfersIntegration } from "../shovelSquared/erc20Transfers";
import { ethTransfersIntegration } from "../shovelSquared/ethTransfers";
import {
  claimCCTPIntegration,
  fastFinishCCTPIntegration,
  startCCTPIntegration,
} from "../shovelSquared/fastCctp";

const allSourceConfigs: Source[] = [];
for (const sourceName of shovelSquaredSourceNames) {
  const source: ShovelSource = shovelSources[sourceName];
  const sourceConfig: Source = {
    name: sourceName,
    chain_id: source.chainId,
    ws_url: `wss://${alchemyRpc(sourceName)}`,
    urls: [
      `https://${alchemyRpc(sourceName)}`,
      `https://${quicknodeRpc(sourceName)}`,
    ],
    batch_size: 100,
    concurrency: 4,
  } as any;

  const traceSourceConfig: Source = {
    name: `${sourceName}Trace`,
    chain_id: source.chainId,
    urls: [`https://${chainstackRpc(sourceName)}`],
    batch_size: 32,
    concurrency: 2,
  } as any;

  allSourceConfigs.push(sourceConfig, traceSourceConfig);
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
  sources: allSourceConfigs,
  integrations,
});

console.log(`✔ Writing Shovel Squared config to shovelSquared/config.json`);
writeFileSync("src/shovelSquared/config.json", toJSON(config, 2));
