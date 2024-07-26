import { makeConfig, toJSON } from "@indexsupply/shovel-config";
import { writeFileSync } from "fs";

import {
  mainnetChains,
  makeAllSourceConfigs,
  testnetChains,
} from "./chainConfig";
import { daimoAccV2Integration } from "./daimoAccReg";
import { erc20TransfersIntegration } from "./erc20Transfers";
import { ethTransfersIntegration } from "./ethTransfers";
import {
  claimCCTPIntegration,
  fastFinishCCTPIntegration,
  startCCTPIntegration,
} from "./fastCctp";

const integrationsFuncs = [
  erc20TransfersIntegration,
  startCCTPIntegration,
  fastFinishCCTPIntegration,
  claimCCTPIntegration,
  ethTransfersIntegration,
  daimoAccV2Integration,
];

// Mainnet jumbo config
const mainnetSourceConfigs = makeAllSourceConfigs(mainnetChains); // both trace and source
const mainnetIntegrations = integrationsFuncs.map((f) => f(mainnetChains));
const mainnetConfig = makeConfig({
  pg_url: "$JUMBO_DATABASE_URL",
  sources: mainnetSourceConfigs,
  integrations: mainnetIntegrations,
});

console.log(`✔ Writing Jumbo Mainnet config to jumbo/mainnet/config.json`);
writeFileSync("src/jumbo/mainnet/config.json", toJSON(mainnetConfig, 2));

// Testnet jumbo config
const testnetSourceConfigs = makeAllSourceConfigs(testnetChains); // both trace and source
const testnetIntegrations = integrationsFuncs.map((f) => f(testnetChains));
const testnetConfig = makeConfig({
  pg_url: "$JUMBO_DATABASE_URL",
  sources: testnetSourceConfigs,
  integrations: testnetIntegrations,
});

console.log(`✔ Writing Jumbo Testnet config to jumbo/testnet/config.json`);
writeFileSync("src/jumbo/testnet/config.json", toJSON(testnetConfig, 2));
