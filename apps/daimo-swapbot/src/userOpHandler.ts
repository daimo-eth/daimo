import {
  ProposedSwap,
  DaimoAccountCall,
  isNativeETH,
  DEFAULT_USEROP_VERIFICATION_GAS_LIMIT,
  DEFAULT_USEROP_CALL_GAS_LIMIT,
  now,
  UserOpHex,
  zUserOpHex,
} from "@daimo/common";
import { daimoAccountABI, erc20ABI } from "@daimo/contract";
import { DaimoOpMetadata } from "@daimo/userop";
import { UserOperationBuilder, Constants, Utils } from "userop";
import { hexToBigInt, Address, encodeFunctionData, maxUint256 } from "viem";

import { rpc } from "./rpc";

const SEND_DEADLINE_SECS = 120;

export class SwapbotOpHandler {
  private opBuilder;
  constructor(private accountAddress: Address, private chainId: number) {
    this.opBuilder = new SwapbotOpBuilder(this.accountAddress);
  }

  /** Execute a proposed swap. */
  public async executeProposedSwap(
    swap: ProposedSwap,
    opMetadata: DaimoOpMetadata
  ) {
    console.log(
      `[SWAPBOT] execute swap ${swap.fromCoin.address} to ${swap.toAmount} via ${swap.execRouterAddress}`
    );

    const executions: DaimoAccountCall[] = [
      {
        dest: swap.execRouterAddress,
        value: hexToBigInt(swap.execValue),
        data: swap.execCallData,
      },
    ];

    if (!isNativeETH(swap.fromCoin, this.chainId)) {
      executions.unshift(
        this.getTokenApproveCall(
          swap.execRouterAddress,
          BigInt(swap.fromAmount),
          swap.fromCoin.address
        )
      );
    }

    const op = this.executeBatch(executions, opMetadata);
    await this.sendUserOp(op);
  }

  private getTokenApproveCall(
    dest: Address,
    amount: bigint = maxUint256, // defaults to infinite
    tokenAddress: Address
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

  /** Build a batch of Daimo Account Calls */
  executeBatch(calls: DaimoAccountCall[], opMetadata: DaimoOpMetadata) {
    return this.opBuilder.setOpMetadata(opMetadata).setCallData(
      encodeFunctionData({
        abi: daimoAccountABI,
        functionName: "executeBatch",
        args: [calls],
      })
    );
  }

  /** Send the userop */
  public async sendUserOp(opBuilder: SwapbotOpBuilder) {
    const nowS = now();
    const validUntil = nowS + SEND_DEADLINE_SECS;
    const builtOp = await opBuilder
      .setValidUntil(validUntil)
      .buildOp(Constants.ERC4337.EntryPoint, this.chainId);

    const hexOp = Utils.OpToJSON(builtOp) as UserOpHex;
    console.log("[OP] sending userOp:", hexOp);
    zUserOpHex.parse(hexOp);

    rpc.sendUserOpV2.mutate({ op: hexOp });
  }
}

/**
 * SwapbotOpBuilder with defaults.
 */
class SwapbotOpBuilder extends UserOperationBuilder {
  /** Execution deadline */
  private validUntil = 0;

  constructor(accountAddress: Address) {
    super();

    // Construct base userop.
    this.setSender(accountAddress)
      .setVerificationGasLimit(DEFAULT_USEROP_VERIFICATION_GAS_LIMIT)
      .setCallGasLimit(DEFAULT_USEROP_CALL_GAS_LIMIT);
  }

  /** Sets user-op nonce and fee payment metadata. */
  setOpMetadata(opMetadata: DaimoOpMetadata) {
    return this.setNonce(opMetadata.nonce.toHex())
      .setMaxFeePerGas(opMetadata.chainGasConstants.maxFeePerGas)
      .setMaxPriorityFeePerGas(
        opMetadata.chainGasConstants.maxPriorityFeePerGas
      )
      .setPreVerificationGas(opMetadata.chainGasConstants.preVerificationGas)
      .setPaymasterAndData(opMetadata.chainGasConstants.paymasterAddress);
  }

  /** Sets a deadline for this userop to execute. */
  setValidUntil(validUntil: number) {
    this.validUntil = validUntil;
    return this;
  }
}
