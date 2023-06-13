import { Client, Presets } from "userop";
import { getContract, parseUnits, encodeFunctionData, parseEther } from "viem";
import * as Contracts from "@daimo/contract";

import config from "../config.json";
import { DaimoAccountBuilder } from "./daimoAccountBuilder";
import { publicClient, SigningCallback } from "./util";

export { SigningCallback };

export class DaimoAccount {
  private dryRun = false;
  private client: Client;
  private daimoAccountBuilder: DaimoAccountBuilder;

  private tokenAddress: `0x${string}`;
  private tokenDecimals: number;

  constructor(
    _dryRun: boolean,
    _client: Client,
    _daimoAccountBuilder: DaimoAccountBuilder,
    _tokenAddress: `0x${string}`,
    _tokenDecimals: number
  ) {
    this.dryRun = _dryRun;
    this.client = _client;
    this.daimoAccountBuilder = _daimoAccountBuilder;

    this.tokenAddress = _tokenAddress;
    this.tokenDecimals = _tokenDecimals;
  }

  public static async init(
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
    const daimoBuilder = await DaimoAccountBuilder.init(
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

    return new DaimoAccount(
      dryRun,
      client,
      daimoBuilder,
      tokenAddress,
      tokenDecimals
    );
  }

  public getAddress(): `0x${string}` {
    return this.daimoAccountBuilder.getSender() as `0x${string}`;
  }

  public async transfer(
    to: `0x${string}`,
    amount: `${number}`
  ): Promise<string | undefined> {
    const ether = parseEther(amount);
    const res = await this.client.sendUserOperation(
      this.daimoAccountBuilder.execute(to, ether, "0x"),
      {
        dryRun: this.dryRun,
        onBuild: (op) => console.log("[OP] Signed UserOperation:", op),
      }
    );
    console.log(`UserOpHash: ${res.userOpHash}`);

    const ev = await res.wait();
    return ev?.transactionHash ?? undefined;
  }

  public async erc20transfer(
    to: `0x${string}`,
    amount: `${number}` // in the native unit of the token
  ): Promise<string | undefined> {
    const parsedAmount = parseUnits(amount, this.tokenDecimals);

    const res = await this.client.sendUserOperation(
      this.daimoAccountBuilder.execute(
        this.tokenAddress,
        0n,
        encodeFunctionData({
          abi: Contracts.erc20ABI,
          functionName: "transfer",
          args: [to, parsedAmount],
        })
      ),
      {
        dryRun: this.dryRun,
        onBuild: (op) => console.log("[OP] Signed UserOperation:", op),
      }
    );
    console.log(`UserOpHash: ${res.userOpHash}`);

    const ev = await res.wait(); // TODO: use getUserOperationStatus?
    return ev?.transactionHash ?? undefined;
  }

  public async erc20approve(
    spender: `0x${string}`,
    amount: `${number}`
  ): Promise<string | undefined> {
    const parsedAmount = parseUnits(amount, this.tokenDecimals);

    const res = await this.client.sendUserOperation(
      this.daimoAccountBuilder.execute(
        this.tokenAddress,
        0n,
        encodeFunctionData({
          abi: Contracts.erc20ABI,
          functionName: "approve",
          args: [spender, parsedAmount],
        })
      ),
      {
        dryRun: this.dryRun,
        onBuild: (op) => console.log("[OP] Signed UserOperation:", op),
      }
    );
    console.log(`UserOpHash: ${res.userOpHash}`);

    const ev = await res.wait(); // TODO: use getUserOperationStatus?
    return ev?.transactionHash ?? undefined;
  }
}
