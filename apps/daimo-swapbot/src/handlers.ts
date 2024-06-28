import { BigIntStr, EAccount, getAccountChain } from "@daimo/common";
import { DaimoNonce, DaimoNonceMetadata, DaimoNonceType } from "@daimo/userop";
import { useMemo } from "react";
import { Address } from "viem";

import { rpc } from "./rpc";
import { SwapbotOpHandler } from "./userOpHandler";

export class SwapBot {
  constructor() {}

  public async swapToBridgeCoin(
    amountIn: number,
    tokenAddress: Address,
    accountAddress: Address,
    chainId: number
  ) {
    const bridgeTokenAddress = getAccountChain(chainId).bridgeCoin.address;
    await this.handleSwap({
      amountIn,
      tokenInAddress: tokenAddress,
      tokenOutAddress: bridgeTokenAddress,
      accountAddress,
      chainId,
    });
  }

  /**
   * Handles a swap on the foreign chain from foreignToken to homeToken.
   */
  async handleSwap({
    amountIn,
    tokenInAddress,
    tokenOutAddress,
    accountAddress,
    chainId,
  }: {
    amountIn: number;
    tokenInAddress: Address;
    tokenOutAddress: Address;
    accountAddress: Address;
    chainId: number;
  }) {
    // Get account history for the user.
    const accountHistory = await rpc.getAccountHistory.query({
      address: accountAddress,
      sinceBlockNum: 0,
    });

    // Create op handler.
    const opHandler = new SwapbotOpHandler(accountAddress, chainId);

    // Get swap quote from tokenIn to tokenOut if necessary.
    const route = await rpc.getSwapQuote.query({
      amountIn: `${amountIn}` as BigIntStr,
      fromToken: tokenInAddress,
      toToken: tokenOutAddress,
      fromAccount: {
        addr: accountAddress,
      },
      toAddr: accountAddress,
      chainId,
    });

    // Execute proposed swap if a swap is needed.
    if (route) {
      const nonce = useMemo(
        () => new DaimoNonce(new DaimoNonceMetadata(DaimoNonceType.Send)),
        []
      );
      const opMetadata = {
        nonce,
        chainGasConstants: accountHistory.chainGasConstants,
      };

      await opHandler.executeProposedSwap(route, opMetadata);
    }
  }
}
