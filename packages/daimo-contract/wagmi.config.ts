import { defineConfig } from "@wagmi/cli";
import { foundry } from "@wagmi/cli/plugins";

import latestAccountFactoryV2 from "../contract/broadcast/DeployAccountFactoryV2.s.sol/8453/run-latest.json";
import latestCCTPBridger from "../contract/broadcast/DeployCCTPBridger.s.sol/8453/run-latest.json";
import latestEphemeralNotes from "../contract/broadcast/DeployEphemeralNotes.s.sol/8453/run-latest.json";
import latestEphemeralNotesV2 from "../contract/broadcast/DeployEphemeralNotesV2.s.sol/8453/run-latest.json";
import latestFastCCTP from "../contract/broadcast/DeployFastCCTP.s.sol/8453/run-latest.json";
import latestFlexSwapper from "../contract/broadcast/DeployFlexSwapper.s.sol/8453/run-latest.json";
import latestNameReg from "../contract/broadcast/DeployNameRegistry.s.sol/8453/run-latest.json";
import latestRequest from "../contract/broadcast/DeployRequest.s.sol/8453/run-latest.json";
import latestPaymaster from "../contract/broadcast/ManagePaymaster.s.sol/8453/deploy-latest.json";

/**
 * We get contract addresses from our latest Base mainnet deployments.
 * Because of CREATE2, all except EphemeralNotes are deterministic.
 */
const deployments = Object.fromEntries(
  [
    ...latestNameReg.transactions,
    ...latestAccountFactoryV2.transactions,
    ...latestEphemeralNotes.transactions,
    ...latestEphemeralNotesV2.transactions,
    ...latestRequest.transactions,
    ...latestPaymaster.transactions,
    ...latestFlexSwapper.transactions,
    ...latestCCTPBridger.transactions,
    ...latestFastCCTP.transactions,
  ]
    .filter((t) => t.transactionType === "CREATE2")
    .map((r) => [r.contractName, r.contractAddress as `0x${string}`])
);

export default defineConfig({
  out: "src/codegen/contracts.ts",
  plugins: [
    foundry({
      project: "../contract",
      deployments,
      forge: { build: false },
      include: [
        "Daimo*.sol/*",
        "ERC*.sol/*",
        "EntryPoint.sol/*",
        "AggregatorV2V3Interface.sol/*",
      ],
    }),
  ],
});
