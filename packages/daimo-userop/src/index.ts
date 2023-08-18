import * as Contracts from "@daimo/contract";
import { Client, ISendUserOperationOpts, Presets } from "userop";
import {
  Address,
  Hex,
  PublicClient,
  Transport,
  encodeFunctionData,
  getAddress,
  parseEther,
  parseUnits,
} from "viem";
import { baseGoerli } from "viem/chains";

import { DaimoOpBuilder } from "./daimoOpBuilder";
import { SigningCallback } from "./util";
import config from "../config.json";

export { SigningCallback };

export type UserOpHandle = Awaited<
  ReturnType<typeof DaimoAccount.prototype.sendUserOp>
>;

export class DaimoAccount {
  private dryRun = false;
  private client: Client;
  private opBuilder: DaimoOpBuilder;

  private tokenAddress: Address;
  private tokenDecimals: number;

  private notesAddress: `0x${string}`;

  constructor(
    _dryRun: boolean,
    _client: Client,
    _opBuilder: DaimoOpBuilder,
    _tokenAddress: `0x${string}`,
    _tokenDecimals: number,
    _notesAddress: `0x${string}`
  ) {
    this.dryRun = _dryRun;
    this.client = _client;
    this.opBuilder = _opBuilder;

    this.tokenAddress = _tokenAddress;
    this.tokenDecimals = _tokenDecimals;

    this.notesAddress = _notesAddress;
  }

  public static async init(
    publicClient: PublicClient<Transport, typeof baseGoerli>,
    derPublicKey: string,
    signer: SigningCallback,
    dryRun: boolean
  ): Promise<DaimoAccount> {
    const rawPublicKey = derPublicKey.slice(-128);
    const contractFriendlyKey: [Hex, Hex] = [
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

    console.log(
      `[OP] init. token ${Contracts.tokenMetadata.address}, decimals ${Contracts.tokenMetadata.decimals}`
    );

    return new DaimoAccount(
      dryRun,
      client,
      daimoBuilder,
      Contracts.tokenMetadata.address,
      Contracts.tokenMetadata.decimals,
      Contracts.ephemeralNotesAddress
    );
  }

  public getAddress(): Address {
    return getAddress(this.opBuilder.getSender());
  }

  /** Submits a user op to bundler. Returns userOpHash. */
  public async sendUserOp(op: DaimoOpBuilder) {
    const opts: ISendUserOperationOpts = {
      dryRun: this.dryRun,
      onBuild: (o) => console.log("[OP] signed userOp:", o),
    };
    const res = await this.client.sendUserOperation(op, opts);
    console.log(`[OP] userOpHash: ${res.userOpHash}`);

    return res;
  }

  /** Sends eth. Returns userOpHash. */
  public async transfer(
    to: Address,
    amount: `${number}`
  ): Promise<UserOpHandle> {
    const ether = parseEther(amount);
    console.log(`[OP] transfer ${ether} wei to ${to}`);

    const op = this.opBuilder.execute(to, ether, "0x");

    return this.sendUserOp(op);
  }

  /** Sends an ERC20 transfer. Returns userOpHash. */
  public async erc20transfer(
    to: Address,
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
    spender: Address,
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

  /**
   * Creates an ephemeral note with given value.
   * Infinite-approves the notes contract first, if necessary.
   * Returns userOpHash.
   **/
  public async createEphemeralNote(
    ephemeralOwner: `0x${string}`,
    amount: `${number}`,
    approveFirst: boolean = false
  ) {
    const parsedAmount = parseUnits(amount, this.tokenDecimals);
    console.log(`[OP] create ${parsedAmount} note for ${ephemeralOwner}`);

    const contracts: Address[] = [this.notesAddress];
    const calls: Hex[] = [
      encodeFunctionData({
        abi: Contracts.ephemeralNotesABI,
        functionName: "createNote",
        args: [ephemeralOwner, parsedAmount],
      }),
    ];

    if (approveFirst) {
      // Infinite approve
      console.log(`[OP] approving notes contract to spend coins`);
      const maxUint256 = 2n ** 256n - 1n;
      contracts.unshift(this.tokenAddress);
      calls.unshift(
        encodeFunctionData({
          abi: Contracts.erc20ABI,
          functionName: "approve",
          args: [this.notesAddress, maxUint256],
        })
      );
    }

    const op = this.opBuilder.executeBatch(contracts, calls);

    return this.sendUserOp(op);
  }

  /** Claims an ephemeral note. Returns userOpHash. */
  public async claimEphemeralNote(
    ephemeralOwner: `0x${string}`,
    signature: `0x${string}`
  ) {
    console.log(`[OP] claim ephemeral note ${ephemeralOwner}`);

    const op = this.opBuilder.execute(
      this.notesAddress,
      0n,
      encodeFunctionData({
        abi: Contracts.ephemeralNotesABI,
        functionName: "claimNote",
        args: [ephemeralOwner, signature],
      })
    );

    return this.sendUserOp(op);
  }
}
