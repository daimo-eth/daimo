import { defineConfig } from "@wagmi/cli";
import { foundry } from "@wagmi/cli/plugins";

import latestAccountFactory from "../contract/broadcast/DeployAccountFactory.s.sol/84531/run-latest.json";
import latestEphemeralNotes from "../contract/broadcast/DeployEphemeralNotes.s.sol/84531/run-latest.json";
import latestNameReg from "../contract/broadcast/DeployNameRegistry.s.sol/84531/run-latest.json";
import latestP256SHA256 from "../contract/broadcast/DeployP256SHA256.s.sol/84531/run-latest.json";

const deployments = Object.fromEntries(
  [
    ...latestNameReg.transactions,
    ...latestP256SHA256.transactions,
    ...latestAccountFactory.transactions,
    ...latestEphemeralNotes.transactions,
  ]
    .filter((t) => ["CREATE", "CREATE2"].includes(t.transactionType))
    .map((r) => [r.contractName, r.contractAddress as `0x${string}`])
);

export default defineConfig({
  out: "src/generated.ts",
  plugins: [
    foundry({
      project: "../contract",
      deployments,
      include: [
        "Daimo*.sol/*",
        "ERC*.sol/*",
        "EntryPoint.sol/*",
        "TransparentUpgradeableProxy.sol/*",
      ],
    }),
  ],
});
