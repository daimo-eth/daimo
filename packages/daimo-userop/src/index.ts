import { Client, Presets } from "userop";
import config from "../config.json";
import { DaimoAccountBuilder } from "./daimoAccountBuilder";
import { getContract, parseUnits, encodeFunctionData, parseEther } from "viem";
import * as Contracts from "@daimo/contract";
import { publicClient, SigningCallback } from "./util";
export { SigningCallback } from "./util";

export class DaimoAccount {
  private dryRun = false;
  private client: Client;
  private daimoAccountBuilder: DaimoAccountBuilder;

  constructor(
    _dryRun: boolean,
    _client: Client,
    _daimoAccountBuilder: DaimoAccountBuilder
  ) {
    this.dryRun = _dryRun;
    this.client = _client;
    this.daimoAccountBuilder = _daimoAccountBuilder;
  }

  public static async init(
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

    return new DaimoAccount(dryRun, client, daimoBuilder);
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

  private async parseErc20Amount(
    amount: `${number}`,
    tokenAddress: `0x${string}`
  ): Promise<bigint> {
    const erc20 = getContract({
      abi: Contracts.erc20ABI,
      address: tokenAddress,
      publicClient,
    });
    const decimals = await erc20.read.decimals(); // TODO: Just hardcode for performance
    return parseUnits(amount, decimals);
  }

  public async erc20transfer(
    tokenAddress: `0x${string}`,
    to: `0x${string}`,
    amount: `${number}` // in the native unit of the token
  ): Promise<string | undefined> {
    const parsedAmount = await this.parseErc20Amount(amount, tokenAddress);

    const res = await this.client.sendUserOperation(
      this.daimoAccountBuilder.execute(
        tokenAddress,
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
    tokenAddress: `0x${string}`,
    spender: `0x${string}`,
    amount: `${number}`
  ): Promise<string | undefined> {
    const parsedAmount = await this.parseErc20Amount(amount, tokenAddress);

    const res = await this.client.sendUserOperation(
      this.daimoAccountBuilder.execute(
        tokenAddress,
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
