import { getEnvApi } from "@daimo/api/src/env";
import { getEOA } from "@daimo/api/src/network/viemClient";
import { TokenRegistry } from "@daimo/api/src/server/tokenRegistry";
import { BigIntStr, ForeignToken, getAccountChain } from "@daimo/common";
import { daimoAccountABI, erc20ABI } from "@daimo/contract";
import {
  Address,
  Chain,
  PublicClient,
  Transport,
  WalletClient,
  createPublicClient,
  createWalletClient,
  formatUnits,
  http,
} from "viem";

import { rpc } from "./rpc";
import { getViemChainConfig } from "./utils";

type ForeignCoinSwap = {
  amountIn: bigint;
  tokenIn: ForeignToken;
  totalAmountOut: bigint;
  homeCoin: ForeignToken;
};

const funderAccount = getEOA(getEnvApi().DAIMO_API_PRIVATE_KEY);

/**
 * Swap bot is in charge of initiating any coin receives from foreign chains
 * to home coin on the home chain.
 *
 * It is configured on one chain.
 * */
export class SwapBot {
  private walletClient: WalletClient;
  private publicClient: PublicClient<Transport, Chain>;

  constructor(
    private tokenReg: TokenRegistry,
    private chainId: number // Foreign chain id
  ) {
    const chain = getViemChainConfig(this.chainId);
    this.publicClient = createPublicClient({
      chain,
      transport: http(), // TODO: change
    }) as any;
    this.walletClient = createWalletClient({
      account: funderAccount,
      chain,
      transport: http(), // TODO: change
    });
  }

  setupListeners(accountAddress: Address) {
    // When a foreign coin swap is successful on the foreign chain, initiate
    // CCTP to the home chain.
    const unwatchForeignCoinSwap = this.publicClient.watchContractEvent({
      address: accountAddress,
      abi: daimoAccountABI, // TODO
      eventName: "ForeignCoinSwap",
      onLogs: async (logs: ForeignCoinSwap[]) => {
        await this.initiateBridge(accountAddress, this.chainId);
      },
    });

    // TODO: add listener for USDC transfers to this account.
  }

  /** Collects money from a foreign chain and receives it on the home chain. */
  public async collectForeignMoneyFromChain(
    accountAddress: Address,
    tokenAddress: Address
  ) {
    // Get balance of the foreign token in the account.
    const foreignTokenBalance = await this.publicClient.readContract({
      address: tokenAddress,
      abi: erc20ABI,
      functionName: "balanceOf",
      args: [accountAddress],
    });
    const foreignToken = this.tokenReg.getToken(tokenAddress, this.chainId);
    if (!foreignToken) {
      throw new Error(
        `No foreign token for ${tokenAddress} on chain ${this.chainId}`
      );
    }
    const balStr =
      formatUnits(foreignTokenBalance, foreignToken.decimals) +
      " " +
      foreignToken.symbol;
    console.log(
      `[SWAPBOT] Found ${balStr} in account ${accountAddress} on chain ${this.chainId}`
    );

    // Swap to bridge coin if necessary.
    const bridgeCoinAddress = getAccountChain(this.chainId).bridgeCoin.address;
    if (bridgeCoinAddress !== tokenAddress) {
      this.swapToBridgeCoin(foreignTokenBalance, tokenAddress, accountAddress);
    }
  }

  /** Swap from a [home coin or foreign coin] to a bridge coin. */
  public async swapToBridgeCoin(
    amountIn: bigint,
    tokenAddress: Address,
    accountAddress: Address
  ) {
    const bridgeTokenAddress = getAccountChain(this.chainId).bridgeCoin.address;
    await this.initiateSwap({
      amountIn,
      tokenInAddress: tokenAddress,
      tokenOutAddress: bridgeTokenAddress,
      accountAddress,
    });
  }

  /** Swap from a bridge coin to a home coin. */
  public async swapFromBridgeCoin(
    amountIn: bigint,
    tokenAddress: Address,
    accountAddress: Address
  ) {
    const bridgeTokenAddress = getAccountChain(this.chainId).bridgeCoin.address;
    await this.initiateSwap({
      amountIn,
      tokenInAddress: bridgeTokenAddress,
      tokenOutAddress: tokenAddress,
      accountAddress,
    });
  }

  /** Handles a swap on the foreign chain from foreignToken to homeToken.*/
  async initiateSwap({
    amountIn,
    tokenInAddress,
    tokenOutAddress,
    accountAddress,
  }: {
    amountIn: bigint;
    tokenInAddress: Address;
    tokenOutAddress: Address;
    accountAddress: Address;
  }) {
    // Get swap quote from tokenIn to tokenOut if necessary.
    const route = await rpc.getSwapQuote.query({
      amountIn: `${amountIn}` as BigIntStr,
      fromToken: tokenInAddress,
      toToken: tokenOutAddress,
      fromAccount: {
        addr: accountAddress,
      },
      toAddr: accountAddress,
      chainId: this.chainId,
    });

    // Execute the swap.
    try {
      await this.walletClient.writeContract({
        address: accountAddress,
        abi: daimoAccountABI, // TODO: use AccountV2
        functionName: "swap",
        args: [amountIn, tokenInAddress, route],
      });
    } catch (e) {
      console.log(`[SWAPBOT] swap failed: ${e}`);
    }
  }

  /** Bridge bridge coin from foreign chain to home chain. */
  async initiateBridge(accountAddress: Address, foreignChainId: number) {
    // Get amount of bridge coin to bridge.
    const foreignChainBridgeToken = getAccountChain(foreignChainId).bridgeCoin;
    const bridgeBalance = await this.publicClient.readContract({
      address: foreignChainBridgeToken.address,
      abi: erc20ABI,
      functionName: "balanceOf",
      args: [accountAddress],
    });

    if (bridgeBalance === 0n) return;

    // Initiate CCTP with bridge token to the home chain.
    try {
      await this.walletClient.writeContract({
        address: accountAddress,
        abi: daimoAccountABI, // TODO: use AccountV2
        functionName: "bridge",
        args: [bridgeBalance, foreignChainBridgeToken.address],
      });
    } catch (e) {
      console.log(`[SWAPBOT] swap failed: ${e}`);
    }
  }
}
