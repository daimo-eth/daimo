"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DaimoAccountBuilder = void 0;
const userop_1 = require("userop");
const daimo_contract_types_1 = require("daimo-contract-types");
const viem_1 = require("viem");
const config_json_1 = __importDefault(require("../config.json"));
const p256_1 = require("@noble/curves/p256");
const util_1 = require("./util");
require("@ethersproject/shims");
require("text-encoding-polyfill");
function getSigningMiddleware(signer) {
    return async (ctx) => {
        const hexMessage = ctx.getUserOpHash().slice(2);
        const signature = await signer(hexMessage);
        const parsedSignature = p256_1.p256.Signature.fromDER(signature);
        ctx.op.signature = `0x${parsedSignature.toCompactHex()}`;
    };
}
class DaimoAccountBuilder extends userop_1.UserOperationBuilder {
    provider;
    entryPoint = (0, viem_1.getContract)({
        abi: daimo_contract_types_1.Contracts.entryPointABI,
        address: (0, viem_1.getAddress)(userop_1.Constants.ERC4337.EntryPoint),
        publicClient: util_1.publicClient,
    });
    factory = (0, viem_1.getContract)({
        abi: daimo_contract_types_1.Contracts.accountFactoryABI,
        address: daimo_contract_types_1.Contracts.accountFactoryAddress,
        publicClient: util_1.publicClient,
    });
    gasMiddleware;
    initCode;
    address;
    constructor(_paymasterMiddleware) {
        super();
        this.provider = new userop_1.BundlerJsonRpcProvider(config_json_1.default.rpcUrl).setBundlerRpc(config_json_1.default.bundlerRpcUrl);
        this.initCode = "0x";
        this.address = "0x";
        this.gasMiddleware =
            _paymasterMiddleware ??
                userop_1.Presets.Middleware.estimateUserOperationGas(this.provider);
    }
    static async init(pubKey, paymasterMiddleware, signUserOperation) {
        const instance = new DaimoAccountBuilder(paymasterMiddleware);
        try {
            instance.initCode = await (0, viem_1.concat)([
                instance.factory.address,
                (0, viem_1.encodeFunctionData)({
                    abi: instance.factory.abi,
                    functionName: "createAccount",
                    args: [pubKey, 0n], // 0n = salt
                }),
            ]);
            await instance.entryPoint.simulate.getSenderAddress([instance.initCode]);
            throw new Error("getSenderAddress: unexpected result");
        }
        catch (err) {
            if (err instanceof viem_1.BaseError &&
                err.cause instanceof viem_1.ContractFunctionRevertedError) {
                const cause = err.cause;
                const sender = cause.data?.args?.[0];
                instance.address = (0, viem_1.getAddress)(sender);
            }
            else {
                throw err;
            }
        }
        const base = instance
            .useDefaults({
            sender: instance.address,
            signature: util_1.dummySignature,
            verificationGasLimit: 2000000n,
        })
            .useMiddleware(instance.resolveAccount)
            .useMiddleware(userop_1.Presets.Middleware.getGasPrice(instance.provider))
            .useMiddleware(userop_1.Presets.Middleware.estimateUserOperationGas(instance.provider))
            .useMiddleware(async (ctx) => {
            ctx.op.verificationGasLimit = 2000000n;
        })
            .useMiddleware(getSigningMiddleware(signUserOperation));
        return base;
    }
    resolveAccount = async (ctx) => {
        ctx.op.nonce = await this.entryPoint.read.getNonce([
            (0, viem_1.getAddress)(ctx.op.sender),
            0n, // "key", always 0 to represent s values are less than half
        ]);
        ctx.op.initCode = ctx.op.nonce == 0n ? this.initCode : "0x";
    };
    execute(to, value, data) {
        return this.setCallData((0, viem_1.encodeFunctionData)({
            abi: daimo_contract_types_1.Contracts.accountABI,
            functionName: "execute",
            args: [to, value, data],
        }));
    }
    executeBatch(to, data) {
        return this.setCallData((0, viem_1.encodeFunctionData)({
            abi: daimo_contract_types_1.Contracts.accountABI,
            functionName: "executeBatch",
            args: [to, data],
        }));
    }
}
exports.DaimoAccountBuilder = DaimoAccountBuilder;
//# sourceMappingURL=daimoAccountBuilder.js.map