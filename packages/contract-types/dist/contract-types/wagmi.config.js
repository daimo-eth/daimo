"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cli_1 = require("@wagmi/cli");
const plugins_1 = require("@wagmi/cli/plugins");
const run_latest_json_1 = __importDefault(require("../contract/broadcast/Deploy.s.sol/84531/run-latest.json"));
const run_latest_json_2 = __importDefault(require("../contract/broadcast/DeployNameRegistry.s.sol/84531/run-latest.json"));
const run_latest_json_3 = __importDefault(require("../contract/broadcast/DeployTestUSDC.s.sol/84531/run-latest.json"));
const deployments = Object.fromEntries([
    ...run_latest_json_2.default.transactions,
    ...run_latest_json_1.default.transactions,
    ...run_latest_json_3.default.transactions,
]
    .filter((t) => ["CREATE", "CREATE2"].includes(t.transactionType))
    .map((r) => [r.contractName, r.contractAddress]));
exports.default = (0, cli_1.defineConfig)({
    out: "src/generated.ts",
    plugins: [(0, plugins_1.foundry)({ project: "../contract", deployments })],
});
//# sourceMappingURL=wagmi.config.js.map