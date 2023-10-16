import { assert, derKeytoContractFriendlyKey } from "@daimo/common";
import * as Contracts from "@daimo/contract";
import { BundlerJsonRpcProvider, Constants, Utils } from "userop";
import {
  Address,
  Hex,
  encodeFunctionData,
  getAddress,
  isHex,
  parseUnits,
} from "viem";

import { DaimoOpBuilder, DaimoOpMetadata } from "./daimoOpBuilder";
import { SigningCallback } from "./signingCallback";
import config from "../config.json";

interface DaimoOpConfig {
  /// Chain ID
  chainId: number;
  /// Bundler RPC URL.
  bundlerRpcUrl: string;
  /// Stablecoin token address.
  tokenAddress: Address;
  /// Decimals for that token.
  tokenDecimals: number;
  /// EphemeralNotes instance. The stablecoin used must match tokenAddress.
  notesAddress: `0x${string}`;
  /// Paymaster, payable in tokenAddress.
  paymasterAddress: Address;
  /// Daimo account address.
  accountAddress: Address;
  /// Signs userops. Must, in some form, check user presence.
  accountSigner: SigningCallback;
}

/// DaimoOpSender constructs user operations for a Daimo account.
/// Supports key rotations, token transfers, and ephemeral note ops.
export class DaimoOpSender {
  /** Connection to the chain */
  private provider: BundlerJsonRpcProvider;

  private constructor(
    private opConfig: DaimoOpConfig,
    private opBuilder: DaimoOpBuilder
  ) {
    this.provider = new BundlerJsonRpcProvider(config.bundlerRpcUrl);
  }

  /**
   * Initializes using the DAIMO_CHAIN and DAIMO_BUNDLER_RPC env vars.
   */
  public static async initFromEnv(
    accountAddress: Address,
    accountSigner: SigningCallback
  ): Promise<DaimoOpSender> {
    const { tokenAddress, tokenDecimals, paymasterAddress, chainL2 } =
      Contracts.chainConfig;

    let bundlerRpcUrl = process.env.DAIMO_BUNDLER_RPC || "";
    if (bundlerRpcUrl === "" && chainL2.network === "base-goerli") {
      bundlerRpcUrl = // Default to testnet
        "https://api.pimlico.io/v1/base-goerli/rpc?apikey=70ecef54-a28e-4e96-b2d3-3ad67fbc1b07";
    }
    if (bundlerRpcUrl === "") {
      throw new Error("Missing DAIMO_BUNDLER_RPC env var");
    }

    return DaimoOpSender.init({
      accountAddress,
      accountSigner,
      bundlerRpcUrl,
      chainId: chainL2.id,
      notesAddress: Contracts.daimoEphemeralNotesAddress,
      paymasterAddress,
      tokenAddress,
      tokenDecimals,
    });
  }

  /**
   * Initializes with all configuration provided: no env vars required.
   */
  public static async init(opConfig: DaimoOpConfig): Promise<DaimoOpSender> {
    const { accountAddress, accountSigner, paymasterAddress } = opConfig;
    const builder = await DaimoOpBuilder.init(
      accountAddress,
      accountSigner,
      paymasterAddress
    );

    const { tokenAddress, tokenDecimals } = opConfig;
    console.log(
      `[OP] init: ${JSON.stringify({
        accountAddress,
        tokenAddress,
        tokenDecimals,
        paymasterAddress,
        notesAddress: opConfig.notesAddress,
        bundlerRpcUrl: opConfig.bundlerRpcUrl,
      })})}`
    );

    return new DaimoOpSender(opConfig, builder);
  }

  public getAddress(): Address {
    return getAddress(this.opBuilder.getSender());
  }

  /** Submits a user op to bundler. Returns userOpHash. */
  public async sendUserOp(opBuilder: DaimoOpBuilder): Promise<Hex> {
    const builtOp = await opBuilder.buildOp(
      Constants.ERC4337.EntryPoint,
      this.opConfig.chainId
    );

    console.log("[OP] built userOp:", builtOp);

    const res: Hex = await this.provider.send("eth_sendUserOperation", [
      Utils.OpToJSON(builtOp),
      Constants.ERC4337.EntryPoint,
    ]);
    assert(isHex(res));

    console.log(`[OP] submitted userOpHash: ${res}`);

    return res;
  }

  /** Adds an account signing key. Returns userOpHash. */
  public async addSigningKey(
    slot: number,
    derPublicKey: Hex,
    opMetadata: DaimoOpMetadata
  ) {
    const contractFriendlyKey = derKeytoContractFriendlyKey(derPublicKey);

    const op = this.opBuilder.executeBatch(
      [
        {
          dest: this.getAddress(),
          value: 0n,
          data: encodeFunctionData({
            abi: Contracts.daimoAccountABI,
            functionName: "addSigningKey",
            args: [slot, contractFriendlyKey],
          }),
        },
      ],
      opMetadata
    );

    return this.sendUserOp(op);
  }

  /** Removes an account signing key. Returns userOpHash. */
  public async removeSigningKey(slot: number, opMetadata: DaimoOpMetadata) {
    const op = this.opBuilder.executeBatch(
      [
        {
          dest: this.getAddress(),
          value: 0n,
          data: encodeFunctionData({
            abi: Contracts.daimoAccountABI,
            functionName: "removeSigningKey",
            args: [slot],
          }),
        },
      ],
      opMetadata
    );

    return this.sendUserOp(op);
  }

  /** Sends an ERC20 transfer. Returns userOpHash. */
  public async erc20transfer(
    to: Address,
    amount: `${number}`, // in the native unit of the token
    opMetadata: DaimoOpMetadata
  ) {
    const { tokenAddress, tokenDecimals } = this.opConfig;

    const parsedAmount = parseUnits(amount, tokenDecimals);
    console.log(`[OP] transfer ${parsedAmount} ${tokenAddress} to ${to}`);

    const op = this.opBuilder.executeBatch(
      [
        {
          dest: tokenAddress,
          value: 0n,
          data: encodeFunctionData({
            abi: Contracts.erc20ABI,
            functionName: "transfer",
            args: [to, parsedAmount],
          }),
        },
      ],
      opMetadata
    );

    return this.sendUserOp(op);
  }

  /** Creates an ephemeral note with given value. Returns userOpHash. */
  public async createEphemeralNote(
    ephemeralOwner: `0x${string}`,
    amount: `${number}`,
    opMetadata: DaimoOpMetadata
  ) {
    const { tokenDecimals, notesAddress } = this.opConfig;

    const parsedAmount = parseUnits(amount, tokenDecimals);
    console.log(`[OP] create ${parsedAmount} note for ${ephemeralOwner}`);

    const op = this.opBuilder.executeBatch(
      [
        {
          dest: notesAddress,
          value: 0n,
          data: encodeFunctionData({
            abi: Contracts.daimoEphemeralNotesABI,
            functionName: "createNote",
            args: [ephemeralOwner, parsedAmount],
          }),
        },
      ],
      opMetadata
    );

    return this.sendUserOp(op);
  }

  /** Claims an ephemeral note. Returns userOpHash. */
  public async claimEphemeralNote(
    ephemeralOwner: `0x${string}`,
    signature: `0x${string}`,
    opMetadata: DaimoOpMetadata
  ) {
    console.log(`[OP] claim ephemeral note ${ephemeralOwner}`);

    const op = this.opBuilder.executeBatch(
      [
        {
          dest: this.opConfig.notesAddress,
          value: 0n,
          data: encodeFunctionData({
            abi: Contracts.daimoEphemeralNotesABI,
            functionName: "claimNote",
            args: [ephemeralOwner, signature],
          }),
        },
      ],
      opMetadata
    );

    return this.sendUserOp(op);
  }
}
