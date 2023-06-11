"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DaimoAccount = void 0;
const userop_1 = require("userop");
const config_json_1 = __importDefault(require("../config.json"));
const daimoAccountBuilder_1 = require("./daimoAccountBuilder");
const viem_1 = require("viem");
const daimo_contract_types_1 = require("daimo-contract-types");
const util_1 = require("./util");
require("@ethersproject/shims");
require("text-encoding-polyfill");
class DaimoAccount {
    dryRun = false;
    client;
    daimoAccountBuilder;
    constructor(_dryRun, _client, _daimoAccountBuilder) {
        this.dryRun = _dryRun;
        this.client = _client;
        this.daimoAccountBuilder = _daimoAccountBuilder;
    }
    static async init(derPublicKey, signer, dryRun) {
        const rawPublicKey = derPublicKey.slice(-128);
        const contractFriendlyKey = [
            `0x${rawPublicKey.slice(0, 64)}`,
            `0x${rawPublicKey.slice(64, 128)}`,
        ];
        const client = await userop_1.Client.init(config_json_1.default.rpcUrl, {
            overrideBundlerRpc: config_json_1.default.bundlerRpcUrl,
        });
        const paymasterMiddleware = config_json_1.default.paymaster.rpcUrl.length > 0
            ? userop_1.Presets.Middleware.verifyingPaymaster(config_json_1.default.paymaster.rpcUrl, config_json_1.default.paymaster.context)
            : undefined;
        const daimoBuilder = await daimoAccountBuilder_1.DaimoAccountBuilder.init(contractFriendlyKey, paymasterMiddleware, signer);
        return new DaimoAccount(dryRun, client, daimoBuilder);
    }
    getAddress() {
        return this.daimoAccountBuilder.getSender();
    }
    async transfer(to, amount) {
        const ether = (0, viem_1.parseEther)(amount);
        const res = await this.client.sendUserOperation(this.daimoAccountBuilder.execute(to, ether, "0x"), {
            dryRun: this.dryRun,
            onBuild: (op) => console.log("[OP] Signed UserOperation:", op),
        });
        console.log(`UserOpHash: ${res.userOpHash}`);
        const ev = await res.wait();
        return ev?.transactionHash ?? undefined;
    }
    async parseErc20Amount(amount, tokenAddress) {
        const erc20 = (0, viem_1.getContract)({
            abi: daimo_contract_types_1.Contracts.erc20ABI,
            address: tokenAddress,
            publicClient: util_1.publicClient,
        });
        const decimals = await erc20.read.decimals(); // TODO: Just hardcode for performance
        return (0, viem_1.parseUnits)(amount, decimals);
    }
    async erc20transfer(tokenAddress, to, amount // in the native unit of the token
    ) {
        const parsedAmount = await this.parseErc20Amount(amount, tokenAddress);
        const res = await this.client.sendUserOperation(this.daimoAccountBuilder.execute(tokenAddress, 0n, (0, viem_1.encodeFunctionData)({
            abi: daimo_contract_types_1.Contracts.erc20ABI,
            functionName: "transfer",
            args: [to, parsedAmount],
        })), {
            dryRun: this.dryRun,
            onBuild: (op) => console.log("[OP] Signed UserOperation:", op),
        });
        console.log(`UserOpHash: ${res.userOpHash}`);
        const ev = await res.wait(); // TODO: use getUserOperationStatus?
        return ev?.transactionHash ?? undefined;
    }
    async erc20approve(tokenAddress, spender, amount) {
        const parsedAmount = await this.parseErc20Amount(amount, tokenAddress);
        const res = await this.client.sendUserOperation(this.daimoAccountBuilder.execute(tokenAddress, 0n, (0, viem_1.encodeFunctionData)({
            abi: daimo_contract_types_1.Contracts.erc20ABI,
            functionName: "approve",
            args: [spender, parsedAmount],
        })), {
            dryRun: this.dryRun,
            onBuild: (op) => console.log("[OP] Signed UserOperation:", op),
        });
        console.log(`UserOpHash: ${res.userOpHash}`);
        const ev = await res.wait(); // TODO: use getUserOperationStatus?
        return ev?.transactionHash ?? undefined;
    }
}
exports.DaimoAccount = DaimoAccount;
//# sourceMappingURL=index.js.map