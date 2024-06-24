import {
  DaimoAccountCall,
  PendingOpEvent,
  ProposedSwap,
  UserOpHex,
  derKeytoContractFriendlyKey,
  isNativeETH,
  now,
  zUserOpHex,
} from "@daimo/common";
import * as Contracts from "@daimo/contract";
import { erc20ABI } from "@daimo/contract";
import { Constants, Utils } from "userop";
import {
  Address,
  Hex,
  encodeFunctionData,
  getAddress,
  hexToBigInt,
  maxUint256,
  parseUnits,
} from "viem";

import { OpSenderCallback, SigningCallback } from "./callback";
import { DaimoOpBuilder, DaimoOpMetadata } from "./daimoOpBuilder";

interface DaimoOpConfig {
  /** Chain ID */
  chainId: number;
  /** Stablecoin token address. */
  tokenAddress: Address;
  /** Decimals for that token. */
  tokenDecimals: number;
  /** EphemeralNotes instance. The stablecoin used must match tokenAddress. */
  notesAddressV1: Address;
  /** EphemeralNotesV2 instance. The stablecoin used must match tokenAddress. */
  notesAddressV2: Address;
  /** Daimo account address. */
  accountAddress: Address;
  /** Signs userops. Must, in some form, check user presence. */
  accountSigner: SigningCallback;
  /** Sends userops. Returns userOpHash. */
  opSender: OpSenderCallback;
  /** Deadline to calculate validUntil before sending each operation */
  deadlineSecs: number;
}

/**
 * DaimoOpSender constructs user operations for a Daimo account.
 * Supports key rotations, token transfers, and ephemeral note ops.
 */
export class DaimoOpSender {
  private constructor(
    public opConfig: DaimoOpConfig,
    private opBuilder: DaimoOpBuilder
  ) {}

  /**
   * Initializes with all configuration provided: no env vars required.
   */
  public static async init(opConfig: DaimoOpConfig): Promise<DaimoOpSender> {
    const { accountAddress, accountSigner } = opConfig;
    const builder = await DaimoOpBuilder.init(accountAddress, accountSigner);

    const { tokenAddress, tokenDecimals } = opConfig;
    console.log(
      `[OP] init: ${JSON.stringify({
        accountAddress,
        tokenAddress,
        tokenDecimals,
        notesAddressV1: opConfig.notesAddressV1,
      })})}`
    );

    return new DaimoOpSender(opConfig, builder);
  }

  public getAddress(): Address {
    return getAddress(this.opBuilder.getSender());
  }

  /** Submits a user op to bundler. Returns PendingOpEvent. */
  public async sendUserOp(
    opBuilder: DaimoOpBuilder,
    memo?: string
  ): Promise<PendingOpEvent> {
    const nowS = now();
    const validUntil = nowS + this.opConfig.deadlineSecs;
    const builtOp = await opBuilder
      .setValidUntil(validUntil)
      .buildOp(Constants.ERC4337.EntryPoint, this.opConfig.chainId);

    // This method is incorrectly named. It does not return JSON, it returns
    // a userop object with all the fields normalized to hex.
    const hexOp = Utils.OpToJSON(builtOp) as UserOpHex;
    console.log("[OP] sending userOp:", hexOp);
    zUserOpHex.parse(hexOp);

    return this.opConfig.opSender(hexOp, memo);
  }

  private getTokenApproveCall(
    dest: Address,
    amount: bigint = maxUint256, // defaults to infinite
    tokenAddress: Address = this.opConfig.tokenAddress // defaults to home coin
  ): DaimoAccountCall {
    return {
      // Approve contract `amount` spending on behalf of the account
      dest: tokenAddress,
      value: 0n,
      data: encodeFunctionData({
        abi: erc20ABI,
        functionName: "approve",
        args: [dest, amount],
      }),
    };
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
    opMetadata: DaimoOpMetadata,
    memo?: string
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

    return this.sendUserOp(op, memo);
  }

  /** Creates an ephemeral note V2 with given value. Returns userOpHash. */
  public async createEphemeralNote(
    ephemeralOwner: Hex,
    amount: `${number}`,
    approveFirst: boolean,
    opMetadata: DaimoOpMetadata,
    memo?: string
  ) {
    const { tokenDecimals, notesAddressV2 } = this.opConfig;

    const parsedAmount = parseUnits(amount, tokenDecimals);
    console.log(`[OP] create ${parsedAmount} note for ${ephemeralOwner}`);

    const executions = [
      {
        dest: notesAddressV2,
        value: 0n,
        data: encodeFunctionData({
          abi: Contracts.daimoEphemeralNotesV2ABI,
          functionName: "createNote",
          args: [ephemeralOwner, parsedAmount],
        }),
      },
    ];

    if (approveFirst) {
      executions.unshift(this.getTokenApproveCall(notesAddressV2));
    }

    const op = this.opBuilder.executeBatch(executions, opMetadata);

    return this.sendUserOp(op, memo);
  }

  /** Claims an ephemeral note. Returns userOpHash. */
  public async claimEphemeralNoteV1(
    ephemeralOwner: Hex,
    signature: Hex,
    opMetadata: DaimoOpMetadata
  ) {
    console.log(`[OP] claim ephemeral note ${ephemeralOwner}`);

    const op = this.opBuilder.executeBatch(
      [
        {
          dest: this.opConfig.notesAddressV1,
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

  public claimEphemeralNoteSelf(
    ephemeralOwner: Hex,
    opMetadata: DaimoOpMetadata
  ) {
    console.log(`[OP] cancel ephemeral note V2 ${ephemeralOwner}`);

    const op = this.opBuilder.executeBatch(
      [
        {
          dest: this.opConfig.notesAddressV2,
          value: 0n,
          data: encodeFunctionData({
            abi: Contracts.daimoEphemeralNotesV2ABI,
            functionName: "claimNoteSelf",
            args: [ephemeralOwner],
          }),
        },
      ],
      opMetadata
    );

    return this.sendUserOp(op);
  }

  public async claimEphemeralNoteRecipient(
    ephemeralOwner: Hex,
    signature: Hex,
    opMetadata: DaimoOpMetadata
  ) {
    console.log(`[OP] claim ephemeral note v2 ${ephemeralOwner}`);

    const { accountAddress, notesAddressV2 } = this.opConfig;

    const op = this.opBuilder.executeBatch(
      [
        {
          dest: notesAddressV2,
          value: 0n,
          data: encodeFunctionData({
            abi: Contracts.daimoEphemeralNotesV2ABI,
            functionName: "claimNoteRecipient",
            args: [ephemeralOwner, accountAddress, signature],
          }),
        },
      ],
      opMetadata
    );

    return this.sendUserOp(op);
  }

  public async approveAndFulfillRequest(
    id: bigint,
    amount: `${number}`, // in the native unit of the token
    opMetadata: DaimoOpMetadata
  ) {
    console.log(`[OP] fulfill request ${id} ${amount}`);

    const parsedAmount = parseUnits(amount, this.opConfig.tokenDecimals);

    const executions: DaimoAccountCall[] = [
      this.getTokenApproveCall(Contracts.daimoRequestAddress, parsedAmount),
      {
        dest: Contracts.daimoRequestAddress,
        value: 0n,
        data: encodeFunctionData({
          abi: Contracts.daimoRequestConfig.abi,
          functionName: "fulfillRequest",
          args: [id],
        }),
      },
    ];

    const op = this.opBuilder.executeBatch(executions, opMetadata);

    return this.sendUserOp(op);
  }

  public async executeProposedSwap(
    swap: ProposedSwap,
    opMetadata: DaimoOpMetadata
  ) {
    console.log(
      `[OP] execute swap ${swap.fromCoin.address} to ${swap.toAmount} via ${swap.execRouterAddress}`
    );

    const executions: DaimoAccountCall[] = [
      {
        dest: swap.execRouterAddress,
        value: hexToBigInt(swap.execValue),
        data: swap.execCallData,
      },
    ];

    if (!isNativeETH(swap.fromCoin, this.opConfig.chainId)) {
      executions.unshift(
        this.getTokenApproveCall(
          swap.execRouterAddress,
          BigInt(swap.fromAmount),
          swap.fromCoin.address
        )
      );
    }

    const op = this.opBuilder.executeBatch(executions, opMetadata);

    return this.sendUserOp(op);
  }

  public async cancelRequest(id: bigint, opMetadata: DaimoOpMetadata) {
    console.log(`[OP] cancel request ${id}`);

    const executions: DaimoAccountCall[] = [
      {
        dest: Contracts.daimoRequestAddress,
        value: 0n,
        data: encodeFunctionData({
          abi: Contracts.daimoRequestConfig.abi,
          functionName: "updateRequest",
          args: [id, 2],
        }),
      },
    ];

    const op = this.opBuilder.executeBatch(executions, opMetadata);

    return this.sendUserOp(op);
  }
}
