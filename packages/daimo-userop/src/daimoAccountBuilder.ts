import {
  Constants,
  UserOperationBuilder,
  BundlerJsonRpcProvider,
  Presets,
} from "userop";
import * as Contracts from "@daimo/contract";
import { UserOperationMiddlewareFn } from "userop";
import {
  BaseError,
  ContractFunctionRevertedError,
  concat,
  encodeFunctionData,
  getAddress,
  getContract,
} from "viem";
import config from "../config.json";
import { p256 } from "@noble/curves/p256";
import { publicClient, SigningCallback, dummySignature } from "./util";

function getSigningMiddleware(
  signer: SigningCallback
): UserOperationMiddlewareFn {
  return async (ctx) => {
    const hexMessage = ctx.getUserOpHash().slice(2);
    const signature = await signer(hexMessage);
    const parsedSignature = p256.Signature.fromDER(signature);
    ctx.op.signature = `0x${parsedSignature.toCompactHex()}`;
  };
}

export class DaimoAccountBuilder extends UserOperationBuilder {
  private provider: BundlerJsonRpcProvider;
  private entryPoint = getContract({
    abi: Contracts.entryPointABI,
    address: getAddress(Constants.ERC4337.EntryPoint),
    publicClient,
  });
  private factory = getContract({
    abi: Contracts.accountFactoryABI,
    address: Contracts.accountFactoryAddress,
    publicClient,
  });
  private gasMiddleware: UserOperationMiddlewareFn;
  private initCode: `0x${string}`;
  address: `0x${string}`;

  private constructor(
    _paymasterMiddleware: UserOperationMiddlewareFn | undefined
  ) {
    super();
    this.provider = new BundlerJsonRpcProvider(config.rpcUrl).setBundlerRpc(
      config.bundlerRpcUrl
    );
    this.initCode = "0x";
    this.address = "0x";
    this.gasMiddleware =
      _paymasterMiddleware ??
      Presets.Middleware.estimateUserOperationGas(this.provider);
  }

  public static async init(
    pubKey: [`0x${string}`, `0x${string}`],
    paymasterMiddleware: UserOperationMiddlewareFn | undefined,
    signUserOperation: SigningCallback
  ): Promise<DaimoAccountBuilder> {
    const instance = new DaimoAccountBuilder(paymasterMiddleware);

    try {
      instance.initCode = await concat([
        instance.factory.address,
        encodeFunctionData({
          abi: instance.factory.abi,
          functionName: "createAccount",
          args: [pubKey, 0n], // 0n = salt
        }),
      ]);

      await instance.entryPoint.simulate.getSenderAddress([instance.initCode]);

      throw new Error("getSenderAddress: unexpected result");
    } catch (err: unknown) {
      if (
        err instanceof BaseError &&
        err.cause instanceof ContractFunctionRevertedError
      ) {
        const cause: ContractFunctionRevertedError = err.cause;
        const sender = cause.data?.args?.[0] as string;
        instance.address = getAddress(sender);
      } else {
        throw err;
      }
    }

    const base = instance
      .useDefaults({
        sender: instance.address,
        signature: dummySignature,
        verificationGasLimit: 2000000n,
      })
      .useMiddleware(instance.resolveAccount)
      .useMiddleware(Presets.Middleware.getGasPrice(instance.provider))
      .useMiddleware(
        Presets.Middleware.estimateUserOperationGas(instance.provider)
      )
      .useMiddleware(async (ctx) => {
        ctx.op.verificationGasLimit = 2000000n;
      })
      .useMiddleware(getSigningMiddleware(signUserOperation));

    return base;
  }

  private resolveAccount: UserOperationMiddlewareFn = async (ctx) => {
    ctx.op.nonce = await this.entryPoint.read.getNonce([
      getAddress(ctx.op.sender),
      0n, // "key", always 0 to represent s values are less than half
    ]);
    ctx.op.initCode = ctx.op.nonce == 0n ? this.initCode : "0x";
  };

  execute(to: `0x${string}`, value: bigint, data: `0x${string}`) {
    return this.setCallData(
      encodeFunctionData({
        abi: Contracts.accountABI,
        functionName: "execute",
        args: [to, value, data],
      })
    );
  }

  executeBatch(to: Array<`0x${string}`>, data: Array<`0x${string}`>) {
    return this.setCallData(
      encodeFunctionData({
        abi: Contracts.accountABI,
        functionName: "executeBatch",
        args: [to, data],
      })
    );
  }
}
