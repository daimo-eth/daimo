import { getBridgeCoin, isTestnetChain } from "@daimo/common";
import {
  cctpMessageTransmitterABI,
  erc20ABI,
  daimoAccountV2ABI,
  daimoFlexSwapperABI,
  swapRouter02Abi,
  daimoFastCctpABI,
  daimoFastCctpAddress,
  daimoFlexSwapperAddress,
} from "@daimo/contract";
import {
  Address,
  Hex,
  decodeEventLog,
  encodeFunctionData,
  keccak256,
  parseAbi,
} from "viem";

import {
  getCCTPMessageTransmitterAddress,
  getViemClient,
  ViemClient,
} from "./config";

/**
 * The purpose of swapbot is to automatically settle assets from foreign chains
 * to a DaimoAccountV2's home chain.
 *
 * Swapbot handles:
 *  (1) swapping a foreignCoin to the bridgeCoin on a foreign chain
 *  (2) initiating FastCCTP on a foreign chain using the bridgeCoin
 *  (3) receiving the bridgeCoin on the home chain
 *  (4) swapping the bridgeCoin to the homeCoin on the home chain
 */
export class SwapBot {
  constructor() {
    console.log(`[SWAPBOT] initialized swapbot`);
  }

  /** Collects money from a foreign chain and receives it on the home chain. */
  public async collect({
    foreignChainId,
    accountAddress,
    tokenForeign,
  }: {
    foreignChainId: number;
    accountAddress: Address;
    tokenForeign: Address;
  }) {
    const vc = getViemClient(foreignChainId);

    // Get balance of the foreign asset in the account.
    const tokenForeignBalance = await vc.publicClient.readContract({
      address: tokenForeign,
      abi: erc20ABI,
      functionName: "balanceOf",
      args: [accountAddress],
    });
    console.log(`[SWAPBOT] found ${tokenForeignBalance} of ${tokenForeign}`);

    // on-chain collect() first swaps to the bridgeCoin (if necessary) and
    // then initiates the FastCCTP on the foreign chain using the bridgeCoin.
    const tokenBridgeAddr = getBridgeCoin(foreignChainId).token;
    try {
      const collectTxHash = await vc.walletClient.writeContract({
        account: vc.account,
        address: accountAddress,
        abi: daimoAccountV2ABI,
        functionName: "collect",
        args: [tokenForeign, tokenForeignBalance, tokenBridgeAddr, "0x", "0x"],
        chain: vc.chain,
      });
      console.log(
        `[SWAPBOT] initiated collect() for account ${accountAddress} on chain ${vc.chain.name} for foreign token ${tokenForeign}`
      );
      return {
        collectTxHash,
        homeChainId: await this.getAccountHomeChain(accountAddress, vc),
      };
    } catch (e) {
      console.log(`[SWAPBOT] collect failed: ${e}`);
    }
  }

  /** Handles a swap from foreignToken to homeToken.*/
  async swapToHomeCoin({
    chainId,
    tokenIn,
    amountIn,
    accountAddress,
    extraData,
  }: {
    chainId: number;
    tokenIn: Address;
    amountIn: bigint;
    accountAddress: Address;
    extraData?: Hex;
  }) {
    const vc = getViemClient(chainId);

    try {
      const swapTxHash = await vc.walletClient.writeContract({
        address: accountAddress,
        abi: daimoAccountV2ABI,
        functionName: "swapToHomeCoin",
        args: [tokenIn, amountIn, extraData || "0x"],
        account: vc.account,
        chain: vc.chain,
      });
      console.log(`[SWAPBOT] swap successful. Tx hash: ${swapTxHash}`);
    } catch (e) {
      console.log(`[SWAPBOT] swap failed: ${e}`);
    }
  }

  /** Receive money on the home chain via attestation. */
  async receive(chainId: number, message: Hex) {
    const vc = getViemClient(chainId);

    // Unlock mint bridge coin on home chain.
    const attestation = await this.getAttestation(message, vc);
    const unlockTxHash = await vc.walletClient.writeContract({
      account: vc.account,
      address: getCCTPMessageTransmitterAddress(vc.chain.id),
      abi: cctpMessageTransmitterABI,
      functionName: "receiveMessage",
      args: [message, attestation],
      chain: vc.chain,
    });
    console.log(
      `[SWAPBOT] unlocked mint on home chain ${vc.chain.name}: ${unlockTxHash}`
    );
    return unlockTxHash;
  }

  /** Fast Finish a CCTP transfer by fronting the money. */
  async fastCCTPFinish({
    fromChainId,
    fromAddr,
    fromAmount,
    toChainId,
    toAddr,
    toToken,
    toAmount,
    nonce,
  }: {
    fromChainId: number;
    fromAddr: Address;
    fromAmount: bigint;
    toChainId: number;
    toAddr: Address;
    toToken: Address;
    toAmount: bigint;
    nonce: bigint;
  }) {
    const vc = getViemClient(toChainId);
    try {
      const fastFinishTxHash = await vc.walletClient.writeContract({
        account: vc.account,
        chain: vc.chain,
        address: daimoFastCctpAddress,
        abi: daimoFastCctpABI,
        functionName: "fastFinishTransfer",
        args: [
          BigInt(fromChainId),
          fromAddr,
          fromAmount,
          toAddr,
          toToken,
          toAmount,
          nonce,
        ],
      });
      console.log(
        `[SWAPBOT] fastFinishTransfer initiated. txHash: ${fastFinishTxHash}`
      );
      return fastFinishTxHash;
    } catch (e) {
      console.log(`[SWAPBOT] fastFinishTransfer failed: ${e}`);
    }
  }

  /** Retrieve the messageSent() event on the foreign chain txHash */
  async getMessageSent(chainId: number, txHash: Hex) {
    const vc = getViemClient(chainId);
    const { logs } = await vc.publicClient.waitForTransactionReceipt({
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

  /** Query the circle API for the attestation signature for a message. */
  async getAttestation(message: Hex, vc: ViemClient) {
    const messageHash = keccak256(message);
    console.log(
      `[SWAPBOT] retrieving CCTP attestation for message hash ${messageHash}`
    );
    const queryURL = isTestnetChain(vc.chain.id)
      ? `https://iris-api-sandbox.circle.com/attestations/${messageHash}`
      : `https://iris-api.circle.com/attestations/${messageHash}`;

    // Attestations are "pending" until Circle is satisfied with block finality.
    // Est. wait times vary by chain:
    // https://developers.circle.com/stablecoins/docs/required-block-confirmations
    let attestationResponse = { status: "pending" } as any;
    while (attestationResponse.status !== "complete") {
      const res = await fetch(queryURL);
      attestationResponse = await res.json();
      await new Promise((r) => setTimeout(r, 2000));
    }
    console.log(
      `[SWAPBOT] retrieved CTTP attestation: ${JSON.stringify(
        attestationResponse
      )}`
    );
    return attestationResponse.attestation;
  }

  // -------------- STATE GET FUNCTIONS  --------------
  // Helper functions for getting state from the DaimoAccountV2 contract.

  /** Get home chain of the account. */
  async getAccountHomeChain(accountAddress: Address, vc: ViemClient) {
    return await vc.publicClient.readContract({
      abi: daimoAccountV2ABI,
      address: accountAddress,
      functionName: "homeChain",
    });
  }

  /** Get home coin of the account. */
  async getAccountHomeCoin(accountAddress: Address, vc: ViemClient) {
    return await vc.publicClient.readContract({
      abi: daimoAccountV2ABI,
      address: accountAddress,
      functionName: "homeCoin",
    });
  }

  // -------------- READ FUNCTIONS  --------------
  // These functions are used for testing on-chain mechanisms.

  /** Test swap quote mechanism. */
  async readQuoteSwap({
    chainId,
    tokenIn,
    amountIn,
    tokenOut,
  }: {
    chainId: number;
    tokenIn: Address;
    amountIn: bigint;
    tokenOut: Address;
  }) {
    const vc = getViemClient(chainId);

    // Get direct quote.
    let directQuote;
    try {
      directQuote = await vc.publicClient.readContract({
        abi: daimoFlexSwapperABI,
        address: daimoFlexSwapperAddress,
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
      hopQuote = await vc.publicClient.readContract({
        abi: daimoFlexSwapperABI,
        address: daimoFlexSwapperAddress,
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
      swapQuote = await vc.publicClient.readContract({
        abi: daimoFlexSwapperABI,
        address: daimoFlexSwapperAddress,
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
        daimoFlexSwapperAddress,
      },
    };
  }

  /** Simulate the swap swap on-chain. */
  async readSimulateSwap({
    chainId,
    tokenIn,
    amountIn,
    tokenOut,
    swapPath,
    swapperAddress,
    accountAddress,
  }: {
    chainId: number;
    tokenIn: Address;
    amountIn: bigint;
    tokenOut: Address;
    swapPath: Hex;
    swapperAddress: Address;
    accountAddress: Address;
  }) {
    const vc = getViemClient(chainId);

    // Encode uniswap call data
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
      tipPayer: vc.account.address,
    };
    const extraData = encodeFunctionData({
      abi: daimoFlexSwapperABI,
      functionName: "extraDataStruct",
      args: [swapperParams],
    });

    // Ensure the account has enough balance to pay for the swap.
    const balance = await vc.publicClient.readContract({
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
      const { result } = await vc.publicClient.simulateContract({
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

  /** Retrieve oracle data for the given swap inputs. */
  async readOracleData(
    chainId: number,
    tokenIn: Address,
    amountIn: bigint,
    tokenOut: Address,
    oraclePeriod: number,
    swapperAddress: Address
  ) {
    const vc = getViemClient(chainId);
    // Get best pool tick for token A <> token B and amountIn.
    let bestPoolTick;
    try {
      bestPoolTick = await vc.publicClient.readContract({
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
      oracleConsult = await vc.publicClient.readContract({
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
}
