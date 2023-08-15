import {
  accountABI,
  accountFactoryABI,
  accountFactoryAddress,
  entryPointABI,
} from "@daimo/contract";
import { p256 } from "@noble/curves/p256";
import {
  BundlerJsonRpcProvider,
  Constants,
  Presets,
  UserOperationBuilder,
  UserOperationMiddlewareFn,
} from "userop";
import {
  Address,
  BaseError,
  ContractFunctionRevertedError,
  PublicClient,
  Transport,
  concat,
  encodeFunctionData,
  getAddress,
} from "viem";
import { baseGoerli } from "viem/chains";

import { SigningCallback, dummySignature } from "./util";
import config from "../config.json";

/** Signs userops. Signer can use the enclave, requesting user permission as needed. */
function getSigningMiddleware(
  signer: SigningCallback
): UserOperationMiddlewareFn {
  return async (ctx) => {
    // hex version of '\x19Ethereum Signed Message:\n32'
    const hexPrefix =
      "19457468657265756d205369676e6564204d6573736167653a0a3332";
    const hexMessage = ctx.getUserOpHash().slice(2);
    const signature = await signer(hexPrefix + hexMessage);
    const parsedSignature = p256.Signature.fromDER(signature);
    ctx.op.signature = `0x${parsedSignature.toCompactHex()}`;
  };
}

/** Creates userops from a Daimo account.  */
export class DaimoOpBuilder extends UserOperationBuilder {
  /** Connection to the chain */
  private provider: BundlerJsonRpcProvider;

  private gasMiddleware: UserOperationMiddlewareFn;
  private initCode: `0x${string}`;

  /** Daimo account address */
  address: `0x${string}`;

  private constructor(
    // TODO: remove JSON RPC dependency
    private publicClient: PublicClient<Transport, typeof baseGoerli>,
    _paymasterMiddleware?: UserOperationMiddlewareFn
  ) {
    super();
    this.provider = new BundlerJsonRpcProvider(config.rpcUrl).setBundlerRpc(
      config.bundlerRpcUrl
    );
    this.initCode = "0x";
    this.address = "0x";
    this.gasMiddleware =
      _paymasterMiddleware ||
      Presets.Middleware.estimateUserOperationGas(this.provider);
  }

  /** Client is used for simulation. Paymaster pays for userops. */
  public static async init(
    publicClient: PublicClient<Transport, typeof baseGoerli>,
    pubKey: [`0x${string}`, `0x${string}`],
    paymasterMiddleware: UserOperationMiddlewareFn | undefined,
    signUserOperation: SigningCallback
  ): Promise<DaimoOpBuilder> {
    const instance = new DaimoOpBuilder(publicClient, paymasterMiddleware);

    try {
      instance.initCode = concat([
        accountFactoryAddress,
        encodeFunctionData({
          abi: accountFactoryABI,
          functionName: "createAccount",
          args: [pubKey, 0n], // 0n = salt
        }),
      ]);

      // TODO: call keccak directly
      await publicClient.simulateContract({
        address: Constants.ERC4337.EntryPoint as Address,
        abi: entryPointABI,
        functionName: "getSenderAddress",
        args: [instance.initCode],
      });

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

    console.log(`[OP]: init address ${instance.address}`);

    const base = instance
      .useDefaults({
        sender: instance.address,
        signature: dummySignature,
        verificationGasLimit: 2000000n,
        callGasLimit: 1000000n,
      })
      .useMiddleware(instance.resolveAccount)
      .useMiddleware(Presets.Middleware.getGasPrice(instance.provider))
      .useMiddleware(instance.gasMiddleware)
      .useMiddleware(async (ctx) => {
        ctx.op.verificationGasLimit = 2000000n;

        // Workaround: Pimlico gas price estimator seems to be too low
        // ctx.op.callGasLimit = Math.floor(Number(ctx.op.callGasLimit) * 10);
      })
      .useMiddleware(getSigningMiddleware(signUserOperation));

    return base;
  }

  private resolveAccount: UserOperationMiddlewareFn = async (ctx) => {
    ctx.op.nonce = await this.publicClient.readContract({
      address: Constants.ERC4337.EntryPoint as Address,
      abi: entryPointABI,
      functionName: "getNonce",
      args: [getAddress(ctx.op.sender), 0n],
    });

    ctx.op.initCode = ctx.op.nonce === 0n ? this.initCode : "0x";
  };

  execute(to: `0x${string}`, value: bigint, data: `0x${string}`) {
    return this.setCallData(
      encodeFunctionData({
        abi: accountABI,
        functionName: "execute",
        args: [to, value, data],
      })
    );
  }

  executeBatch(to: `0x${string}`[], data: `0x${string}`[]) {
    return this.setCallData(
      encodeFunctionData({
        abi: accountABI,
        functionName: "executeBatch",
        args: [to, data],
      })
    );
  }
}
