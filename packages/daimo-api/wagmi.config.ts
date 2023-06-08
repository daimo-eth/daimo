import { defineConfig } from "@wagmi/cli";
import { foundry } from "@wagmi/cli/plugins";

import latestNameReg from "../contract/broadcast/DeployNameRegistry.s.sol/84531/run-latest.json";
import latest4337 from "../contract/broadcast/Deploy.s.sol/84531/run-latest.json";

const deployments = Object.fromEntries(
  [...latestNameReg.transactions, ...latest4337.transactions]
    .filter((t) => ["CREATE", "CREATE2"].includes(t.transactionType))
    .map((r) => [r.contractName, r.contractAddress as `0x${string}`])
);

export default defineConfig({
  out: "gen/contract.ts",
  plugins: [foundry({ project: "../contract", deployments })],
});
