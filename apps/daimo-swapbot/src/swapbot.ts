import { getEnvApi } from "@daimo/api/src/env";
import { getEOA } from "@daimo/api/src/network/viemClient";
import { getBridgeCoin, isTestnetChain } from "@daimo/common";
import {
  cctpMessageTransmitterABI,
  erc20ABI,
  daimoAccountV2ABI,
  daimoFlexSwapperABI,
  swapRouter02Abi,
} from "@daimo/contract";
import {
  Address,
  Chain,
  Hex,
  PrivateKeyAccount,
  PublicClient,
  Transport,
  WalletClient,
  createPublicClient,
  createWalletClient,
  decodeEventLog,
  encodeFunctionData,
  http,
  keccak256,
  parseAbi,
} from "viem";

import { getCCTPMessageTransmitterAddress, getViemChainConfig } from "./utils";

const funderAccount = getEOA(getEnvApi().DAIMO_API_PRIVATE_KEY);

/**
 * Swap bot is in charge of (1) initiating swap + CCTP on foreign chains
 * to home coin on the home chain and (2) receiving assets on the home chain.
 *
 * There is one bot per chain.
 */
export class SwapBot {
  private walletClient: WalletClient;
  private publicClient: PublicClient<Transport, Chain>;
  private account: PrivateKeyAccount;
  chain: Chain;

  constructor(private chainId: number) {
    this.chain = getViemChainConfig(this.chainId);
    this.publicClient = createPublicClient({
      chain: this.chain,
      transport: http(), // TODO: change
    }) as any;
    this.walletClient = createWalletClient({
      account: funderAccount,
      chain: this.chain,
      transport: http(), // TODO: change
    });
    this.account = funderAccount;

    console.log(`[SWAPBOT] initialized swapbot for chain ${this.chain.name}`);
  }

  /** Collects money from a foreign chain and receives it on the home chain. */
  public async collectOnForeignChain(
    accountAddress: Address,
    tokenForeign: Address
  ) {
    // Get balance of the foreign asset in the account.
    const tokenForeignBalance = await this.publicClient.readContract({
      address: tokenForeign,
      abi: erc20ABI,
      functionName: "balanceOf",
      args: [accountAddress],
    });

    // Get home chain of the account.
    const homeChainId = await this.publicClient.readContract({
      abi: daimoAccountV2ABI,
      address: accountAddress,
      functionName: "homeChain",
    });

    // Collect swaps to bridge coin if necessary then initiates bridge.
    const tokenBridgeAddr = getBridgeCoin(this.chainId).token;
    try {
      const collectTxHash = await this.walletClient.writeContract({
        account: this.account,
        address: accountAddress,
        abi: daimoAccountV2ABI,
        functionName: "collect",
        args: [tokenForeign, tokenForeignBalance, tokenBridgeAddr, "0x", "0x"],
        chain: this.chain,
      });
      console.log(
        `[SWAPBOT] initiated collect for account ${accountAddress} on chain ${this.chain.name} for foreign token ${tokenForeign}`
      );
      return {
        collectTxHash,
        homeChainId,
      };
    } catch (e) {
      console.log(`[SWAPBOT] collect failed: ${e}`);
    }
  }

  /** Test swap quote mechanism. */
  async quoteSwap({
    tokenIn,
    amountIn,
    tokenOut,
    swapperAddress,
  }: {
    tokenIn: Address;
    amountIn: bigint;
    tokenOut: Address;
    swapperAddress: Address;
  }) {
    // Get direct quote.
    let directQuote;
    try {
      directQuote = await this.publicClient.readContract({
        abi: daimoFlexSwapperABI,
        address: swapperAddress,
        functionName: "quoteDirect",
        args: [tokenIn, amountIn, tokenOut],
      });
    } catch (e) {
      return { message: "quoteDirect failed", error: e };
    }
    const directAmountOut: bigint = directQuote[0];
    const directFee: number = directQuote[1];

    // Get quote via hop.
    let hopQuote;
    try {
      hopQuote = await this.publicClient.readContract({
        abi: daimoFlexSwapperABI,
        address: swapperAddress,
        functionName: "quoteViaHop",
        args: [tokenIn, amountIn, tokenOut],
      });
    } catch (e) {
      return { message: "quoteHop failed", error: e };
    }
    const hopAmountOut: bigint = hopQuote[0];
    const swapPathViaHop = hopQuote[1];

    // Get best quote.
    let swapQuote;
    try {
      swapQuote = await this.publicClient.readContract({
        abi: daimoFlexSwapperABI,
        address: swapperAddress,
        functionName: "quote",
        args: [tokenIn, amountIn, tokenOut],
      });
    } catch (e) {
      console.log(`[SWAPBOT] quote failed: ${e}`);
      return { error: e };
    }

    const amountOut: bigint = swapQuote[0];
    const swapPath = swapQuote[1];
    if (amountOut === 0n)
      return { error: "No swap path found. Amount out is 0" };

    return {
      inputs: {
        tokenIn,
        amountIn,
        tokenOut,
      },
      directQuote: {
        amountOut: directAmountOut,
        fee: directFee,
      },
      hopQuote: {
        amountOut: hopAmountOut,
        swapPath: swapPathViaHop,
      },
      finalQuote: {
        amountOut,
        swapPath,
        hopPathTaken: swapPath === swapPathViaHop,
        swapperAddress,
      },
    };
  }

  async simulateSwap({
    tokenIn,
    amountIn,
    tokenOut,
    swapPath,
    swapperAddress,
    accountAddress,
  }: {
    tokenIn: Address;
    amountIn: bigint;
    tokenOut: Address;
    swapPath: Hex;
    swapperAddress: Address;
    accountAddress: Address;
  }) {
    // Encode uniswap call data
    // TODO: support native ETH sends
    const callData = encodeFunctionData({
      abi: swapRouter02Abi,
      functionName: "exactInput",
      args: [
        {
          path: swapPath,
          recipient: accountAddress, // send to self
          amountIn,
          amountOutMinimum: 0n,
        },
      ],
    });

    // Encode params as DaimoFlexSwapperExtraData
    const swapperParams = {
      callDest: swapperAddress,
      callData,
      tipToExactAmountOut: 0n, // TODO: do we want to test with tips?
      tipPayer: funderAccount.address,
    };
    const extraData = encodeFunctionData({
      abi: daimoFlexSwapperABI,
      functionName: "extraDataStruct",
      args: [swapperParams],
    });

    // Ensure the account has enough balance to pay for the swap.
    const balance = await this.publicClient.readContract({
      abi: erc20ABI,
      address: tokenIn,
      functionName: "balanceOf",
      args: [accountAddress],
    });
    if (balance < amountIn) {
      return { error: "Insufficient balance for swap" };
    }

    // Simulate on-chain swap and return the result.
    try {
      const { result } = await this.publicClient.simulateContract({
        abi: daimoFlexSwapperABI,
        address: swapperAddress,
        functionName: "swapToCoin",
        args: [tokenIn, amountIn, tokenOut, extraData],
      });
      console.log(
        `[SWAPBOT] simulated swap SUCCESS. Simulated swap amount out: ${result}`
      );
      return { amountOut: result };
    } catch (err) {
      const contractError = err as any;
      console.log(`[SWAPBOT] simulated swap FAILED: ${err}`);
      if (contractError.shortMessage) {
        console.log(
          `[SWAPBOT] simulated swap FAILED: ${contractError.shortMessage}`
        );
        return { error: contractError.shortMessage };
      }
    }
  }

  async getOracleData(
    tokenIn: Address,
    amountIn: bigint,
    tokenOut: Address,
    oraclePeriod: number,
    swapperAddress: Address
  ) {
    // Get best pool tick for token A <> token B and amountIn.
    let bestPoolTick;
    try {
      bestPoolTick = await this.publicClient.readContract({
        abi: daimoFlexSwapperABI,
        address: swapperAddress,
        functionName: "getBestPoolTick",
        args: [tokenIn, amountIn, tokenOut],
      });
    } catch (e) {
      return {
        message: "getBestPoolTick failed",
        error: e,
        tokenIn,
        amountIn,
        tokenOut,
      };
    }
    const bestPoolAddress = bestPoolTick[0];
    const tick = bestPoolTick[1];
    const fee = bestPoolTick[2];
    const bestAmountOut = bestPoolTick[3];

    // Consult the oracle for pool data.
    let oracleConsult;
    try {
      oracleConsult = await this.publicClient.readContract({
        abi: daimoFlexSwapperABI,
        address: swapperAddress,
        functionName: "consultOracle",
        args: [bestPoolAddress, oraclePeriod], // 60 seconds ago
      });
    } catch (e) {
      return {
        message: "consultOracle failed",
        error: e,
        poolAddress: bestPoolAddress,
        secondsAgo: oraclePeriod,
      };
    }
    const arithmeticMeanTick = oracleConsult[0];
    const harmonicMeanLiquidity = oracleConsult[1];
    return {
      getBestPoolTick: {
        bestPoolAddress,
        tick,
        fee,
        bestAmountOut,
      },
      oracleConsult: {
        arithmeticMeanTick,
        harmonicMeanLiquidity,
        secondsAgo: oraclePeriod,
      },
      swapperAddress,
    };
  }

  // Get the account's swapper address.
  async getSwapperAddress(accountAddress: Address) {
    return await this.publicClient.readContract({
      abi: daimoAccountV2ABI,
      address: accountAddress,
      functionName: "swapper",
    });
  }

  /** Handles a swap on the foreign chain from foreignToken to homeToken.*/
  async swapToHomeCoin({
    tokenIn,
    amountIn,
    accountAddress,
    extraData,
  }: {
    tokenIn: Address;
    amountIn: bigint;
    accountAddress: Address;
    extraData?: Hex;
  }) {
    // Execute the swap.
    try {
      await this.walletClient.writeContract({
        address: accountAddress,
        abi: daimoAccountV2ABI,
        functionName: "swapToHomeCoin",
        args: [tokenIn, amountIn, extraData || "0x"],
        account: this.account,
        chain: this.chain,
      });
      console.log(`[SWAPBOT] swap successful`);
    } catch (e) {
      console.log(`[SWAPBOT] swap failed: ${e}`);
    }
  }

  /** Receive money on the home chain. */
  async receiveOnHomeChain(message: Hex) {
    const attestation = await this.getAttestation(message);

    // Unlock mint on home chain.
    const unlockTxHash = await this.walletClient.writeContract({
      account: this.account,
      address: getCCTPMessageTransmitterAddress(this.chainId),
      abi: cctpMessageTransmitterABI,
      functionName: "receiveMessage",
      args: [message, attestation],
      chain: this.chain,
    });
    console.log(
      `[SWAPBOT] unlocked mint on home chain ${this.chain.name}: ${unlockTxHash}`
    );
    return unlockTxHash;
  }
  // Retrieve the messageSent() event on the foreign chain txHash.
  async getMessageSent(txHash: Hex) {
    const { logs } = await this.publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    // CCTP MEssageSent event selector.
    const eventTopic =
      "0x8c5261668696ce22758910d05bab8f186d6eb247ceac2af2e82c7dc17669b036";
    const log = logs.find((l) => l.topics[0] === eventTopic);
    if (!log) return;
    const decodedLog = decodeEventLog({
      abi: parseAbi(["event MessageSent(bytes message)"]),
      data: log.data,
      topics: log.topics,
    });

    return decodedLog.args.message;
  }

  // Query the circle API for the attestation signature for a message.
  async getAttestation(message: Hex) {
    const messageHash = keccak256(message);
    console.log(
      `[SWAPBOT] retrieving attestation for message hash ${messageHash}`
    );
    const queryURL = isTestnetChain(this.chain.id)
      ? `https://iris-api-sandbox.circle.com/attestations/${messageHash}`
      : `https://iris-api.circle.com/attestations/${messageHash}`;

    let attestationResponse = { status: "pending" } as any;
    while (attestationResponse.status !== "complete") {
      const res = await fetch(queryURL);
      attestationResponse = await res.json();
      await new Promise((r) => setTimeout(r, 2000));
    }
    console.log(
      `[SWAPBOT] retrieved Circle attestation: ${JSON.stringify(
        attestationResponse
      )}`
    );
    return attestationResponse.attestation;
  }
}
