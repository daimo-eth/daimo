import * as Contracts from "@daimo/contract";
import { Client, ISendUserOperationOpts, Presets } from "userop";
import {
  PublicClient,
  encodeFunctionData,
  getContract,
  parseEther,
  parseUnits,
} from "viem";

import config from "../config.json";
import { DaimoOpBuilder } from "./daimoOpBuilder";
import { SigningCallback } from "./util";

export { SigningCallback };

export type UserOpHandle = Awaited<
  ReturnType<typeof DaimoAccount.prototype.sendUserOp>
>;

export class DaimoAccount {
  private dryRun = false;
  private client: Client;
  private opBuilder: DaimoOpBuilder;

  private tokenAddress: `0x${string}`;
  private tokenDecimals: number;

  constructor(
    _dryRun: boolean,
    _client: Client,
    _opBuilder: DaimoOpBuilder,
    _tokenAddress: `0x${string}`,
    _tokenDecimals: number
  ) {
    this.dryRun = _dryRun;
    this.client = _client;
    this.opBuilder = _opBuilder;

    this.tokenAddress = _tokenAddress;
    this.tokenDecimals = _tokenDecimals;
  }

  public static async init(
    publicClient: PublicClient,
    tokenAddress: `0x${string}`,
    derPublicKey: string,
    signer: SigningCallback,
    dryRun: boolean
  ): Promise<DaimoAccount> {
    const rawPublicKey = derPublicKey.slice(-128);
    const contractFriendlyKey: [`0x${string}`, `0x${string}`] = [
      `0x${rawPublicKey.slice(0, 64)}`,
      `0x${rawPublicKey.slice(64, 128)}`,
    ];

    const client = await Client.init(config.rpcUrl, {
      overrideBundlerRpc: config.bundlerRpcUrl,
    });

    const paymasterMiddleware =
      config.paymaster.rpcUrl.length > 0
        ? Presets.Middleware.verifyingPaymaster(
            config.paymaster.rpcUrl,
            config.paymaster.context
          )
        : undefined;
    const daimoBuilder = await DaimoOpBuilder.init(
      publicClient,
      contractFriendlyKey,
      paymasterMiddleware,
      signer
    );

    const erc20 = getContract({
      abi: Contracts.erc20ABI,
      address: tokenAddress,
      publicClient,
    });

    const tokenDecimals = await erc20.read.decimals();
    console.log(`[OP] init. token ${tokenAddress}, decimals ${tokenDecimals}`);

    return new DaimoAccount(
      dryRun,
      client,
      daimoBuilder,
      tokenAddress,
      tokenDecimals
    );
  }

  public getAddress(): `0x${string}` {
    return this.opBuilder.getSender() as `0x${string}`;
  }

  /** Submits a user op to bundler. Returns userOpHash. */
  public async sendUserOp(op: DaimoOpBuilder) {
    const opts: ISendUserOperationOpts = {
      dryRun: this.dryRun,
      onBuild: (o) => console.log("[OP] Signed UserOperation:", o),
    };
    const res = await this.client.sendUserOperation(op, opts);
    console.log(`[OP] UserOpHash: ${res.userOpHash}`);

    return res;
  }

  /** Sends eth. Returns userOpHash. */
  public async transfer(
    to: `0x${string}`,
    amount: `${number}`
  ): Promise<UserOpHandle> {
    const ether = parseEther(amount);
    console.log(`[OP] transfer ${ether} wei to ${to}`);

    const op = this.opBuilder.execute(to, ether, "0x");

    return this.sendUserOp(op);
  }

  /** Sends an ERC20 transfer. Returns userOpHash. */
  public async erc20transfer(
    to: `0x${string}`,
    amount: `${number}` // in the native unit of the token
  ): Promise<UserOpHandle> {
    const parsedAmount = parseUnits(amount, this.tokenDecimals);
    console.log(`[OP] transfer ${parsedAmount} ${this.tokenAddress} to ${to}`);

    const op = this.opBuilder.execute(
      this.tokenAddress,
      0n,
      encodeFunctionData({
        abi: Contracts.erc20ABI,
        functionName: "transfer",
        args: [to, parsedAmount],
      })
    );

    return this.sendUserOp(op);
  }

  /** Sends an ERC20 approval. Returns userOpHash. */
  public async erc20approve(
    spender: `0x${string}`,
    amount: `${number}`
  ): Promise<UserOpHandle> {
    const parsedAmount = parseUnits(amount, this.tokenDecimals);
    console.log(
      `[OP] approve ${parsedAmount} ${this.tokenAddress} for ${spender}`
    );

    const op = this.opBuilder.execute(
      this.tokenAddress,
      0n,
      encodeFunctionData({
        abi: Contracts.erc20ABI,
        functionName: "approve",
        args: [spender, parsedAmount],
      })
    );

    return this.sendUserOp(op);
  }
}
