import {
  ChainGasConstants,
  DEFAULT_USEROP_CALL_GAS_LIMIT,
  DEFAULT_USEROP_VERIFICATION_GAS_LIMIT,
  PendingOpEvent,
  ProposedSwap,
  UserOpHex,
  derKeytoContractFriendlyKey,
  zUserOpHex,
} from "@daimo/common";
import * as Contracts from "@daimo/contract";
import { erc20ABI } from "@daimo/contract";
import { UserOperation } from "permissionless/_types/types";
import {
  Address,
  Chain,
  Hex,
  PublicClient,
  Transport,
  encodeFunctionData,
  getAddress,
  hexToBigInt,
  maxUint256,
  parseUnits,
} from "viem";

import { OpSenderCallback, SigningCallback } from "./callback";
import { DaimoSmartAccount, signerToDaimoSmartAccount } from "./daimoAccount";
import { DaimoNonce } from "./nonce";

// Metadata for a userop: nonce and paymaster constant.
export type DaimoOpMetadata = {
  nonce: DaimoNonce;
  chainGasConstants: ChainGasConstants;
};

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
    private account: DaimoSmartAccount
  ) {}

  /**
   * Initializes with all configuration provided: no env vars required.
   */
  public static async init<
    transport extends Transport,
    chain extends Chain | undefined = undefined
  >(
    publicClient: PublicClient<transport, chain>,
    opConfig: DaimoOpConfig
  ): Promise<DaimoOpSender> {
    const { accountAddress, accountSigner } = opConfig;

    const account = await signerToDaimoSmartAccount(publicClient, {
      signer: accountSigner,
      address: accountAddress,
      deadlineSecs: opConfig.deadlineSecs,
    });

    const { tokenAddress, tokenDecimals } = opConfig;
    console.log(
      `[OP] init: ${JSON.stringify({
        accountAddress,
        tokenAddress,
        tokenDecimals,
        notesAddressV1: opConfig.notesAddressV1,
      })})}`
    );

    return new DaimoOpSender(opConfig, account);
  }

  public getAddress(): Address {
    return getAddress(this.account.address);
  }

  /** Submits a user op to bundler. Returns PendingOpEvent. */
  public async sendUserOp(
    op: UserOperation<"v0.6">,
    memo?: string
  ): Promise<PendingOpEvent> {
    const hexOp: UserOpHex = {
      ...op,
      nonce: `0x${op.nonce.toString(16)}`,
      callGasLimit: `0x${op.callGasLimit.toString(16)}`,
      verificationGasLimit: `0x${op.verificationGasLimit.toString(16)}`,
      preVerificationGas: `0x${op.preVerificationGas.toString(16)}`,
      maxFeePerGas: `0x${op.maxFeePerGas.toString(16)}`,
      maxPriorityFeePerGas: `0x${op.maxPriorityFeePerGas.toString(16)}`,
    };

    console.log("[OP] sending userOp:", hexOp);
    zUserOpHex.parse(hexOp);

    return this.opConfig.opSender(hexOp, memo);
  }

  private getTokenApproveCall(
    dest: Address,
    amount: bigint = maxUint256, // defaults to infinite
    tokenAddress: Address = this.opConfig.tokenAddress // defaults to home coin
  ) {
    return {
      // Approve contract `amount` spending on behalf of the account
      to: tokenAddress,
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

    const callData = await this.account.encodeCallData({
      to: this.getAddress(),
      value: 0n,
      data: encodeFunctionData({
        abi: Contracts.daimoAccountABI,
        functionName: "addSigningKey",
        args: [slot, contractFriendlyKey],
      }),
    });

    return this.call(callData, opMetadata);
  }

  /** Removes an account signing key. Returns userOpHash. */
  public async removeSigningKey(slot: number, opMetadata: DaimoOpMetadata) {
    const callData = await this.account.encodeCallData({
      to: this.getAddress(),
      value: 0n,
      data: encodeFunctionData({
        abi: Contracts.daimoAccountABI,
        functionName: "removeSigningKey",
        args: [slot],
      }),
    });

    return this.call(callData, opMetadata);
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

    const callData = await this.account.encodeCallData({
      to: tokenAddress,
      value: 0n,
      data: encodeFunctionData({
        abi: Contracts.erc20ABI,
        functionName: "transfer",
        args: [to, parsedAmount],
      }),
    });

    return this.call(callData, opMetadata, memo);
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
        to: notesAddressV2,
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

    const callData = await this.account.encodeCallData(executions);

    return this.call(callData, opMetadata);
  }

  /** Claims an ephemeral note. Returns userOpHash. */
  public async claimEphemeralNoteV1(
    ephemeralOwner: Hex,
    signature: Hex,
    opMetadata: DaimoOpMetadata
  ) {
    console.log(`[OP] claim ephemeral note ${ephemeralOwner}`);

    const callData = await this.account.encodeCallData({
      to: this.opConfig.notesAddressV1,
      value: 0n,
      data: encodeFunctionData({
        abi: Contracts.daimoEphemeralNotesABI,
        functionName: "claimNote",
        args: [ephemeralOwner, signature],
      }),
    });

    return this.call(callData, opMetadata);
  }

  public async claimEphemeralNoteSelf(
    ephemeralOwner: Hex,
    opMetadata: DaimoOpMetadata
  ) {
    console.log(`[OP] cancel ephemeral note V2 ${ephemeralOwner}`);

    const callData = await this.account.encodeCallData({
      to: this.opConfig.notesAddressV2,
      value: 0n,
      data: encodeFunctionData({
        abi: Contracts.daimoEphemeralNotesV2ABI,
        functionName: "claimNoteSelf",
        args: [ephemeralOwner],
      }),
    });

    return this.call(callData, opMetadata);
  }

  public async claimEphemeralNoteRecipient(
    ephemeralOwner: Hex,
    signature: Hex,
    opMetadata: DaimoOpMetadata
  ) {
    console.log(`[OP] claim ephemeral note v2 ${ephemeralOwner}`);

    const { accountAddress, notesAddressV2 } = this.opConfig;

    const callData = await this.account.encodeCallData({
      to: notesAddressV2,
      value: 0n,
      data: encodeFunctionData({
        abi: Contracts.daimoEphemeralNotesV2ABI,
        functionName: "claimNoteRecipient",
        args: [ephemeralOwner, accountAddress, signature],
      }),
    });

    return this.call(callData, opMetadata);
  }

  public async approveAndFulfillRequest(
    id: bigint,
    amount: `${number}`, // in the native unit of the token
    opMetadata: DaimoOpMetadata
  ) {
    console.log(`[OP] fulfill request ${id} ${amount}`);

    const parsedAmount = parseUnits(amount, this.opConfig.tokenDecimals);

    const executions = [
      this.getTokenApproveCall(Contracts.daimoRequestAddress, parsedAmount),
      {
        to: Contracts.daimoRequestAddress,
        value: 0n,
        data: encodeFunctionData({
          abi: Contracts.daimoRequestConfig.abi,
          functionName: "fulfillRequest",
          args: [id],
        }),
      },
    ];

    const callData = await this.account.encodeCallData(executions);

    return this.call(callData, opMetadata);
  }

  public async executeProposedSwap(
    swap: ProposedSwap,
    opMetadata: DaimoOpMetadata
  ) {
    console.log(
      `[OP] execute swap ${swap.fromCoin.token} to ${swap.toAmount} via ${swap.execRouterAddress}`
    );

    const executions = [
      {
        to: swap.execRouterAddress,
        value: hexToBigInt(swap.execValue),
        data: swap.execCallData,
      },
    ];

    if (swap.fromCoin.token !== "ETH") {
      executions.unshift(
        this.getTokenApproveCall(
          swap.execRouterAddress,
          BigInt(swap.fromAmount),
          swap.fromCoin.token
        )
      );
    }

    const callData = await this.account.encodeCallData(executions);

    return this.call(callData, opMetadata);
  }

  public async cancelRequest(id: bigint, opMetadata: DaimoOpMetadata) {
    console.log(`[OP] cancel request ${id}`);

    const callData = await this.account.encodeCallData({
      to: Contracts.daimoRequestAddress,
      value: 0n,
      data: encodeFunctionData({
        abi: Contracts.daimoRequestConfig.abi,
        functionName: "updateRequest",
        args: [id, 2],
      }),
    });

    return this.call(callData, opMetadata);
  }

  private async call(
    callData: Hex,
    opMetadata: DaimoOpMetadata,
    memo?: string
  ) {
    const op: UserOperation<"v0.6"> = {
      sender: this.account.address,
      nonce: BigInt(opMetadata.nonce.toHex()),
      initCode: "0x",
      callData,
      maxFeePerGas: BigInt(opMetadata.chainGasConstants.maxFeePerGas),
      maxPriorityFeePerGas: BigInt(
        opMetadata.chainGasConstants.maxPriorityFeePerGas
      ),
      preVerificationGas: BigInt(
        opMetadata.chainGasConstants.preVerificationGas
      ),
      paymasterAndData: opMetadata.chainGasConstants.paymasterAddress,
      verificationGasLimit: DEFAULT_USEROP_VERIFICATION_GAS_LIMIT,
      callGasLimit: DEFAULT_USEROP_CALL_GAS_LIMIT,
      signature: "0x",
    };

    const signature = await this.account.signUserOperation(op);
    op.signature = signature;

    return this.sendUserOp(op, memo);
  }
}
