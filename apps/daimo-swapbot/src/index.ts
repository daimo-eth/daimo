import { BigIntStr } from "@daimo/common";
import * as bodyParser from "body-parser";
import * as dotenv from "dotenv";
import express, { Request, Response } from "express";
import { Address, Hex } from "viem";

import { SwapBotCollective } from "./swapbotCollective";

dotenv.config();

const app = express();
const port = 3008;

// Setup swap bot on every chain.
const swapBotCollective = new SwapBotCollective();

app.use(bodyParser.json());
app.get("/health", (req: Request, res: Response) => res.send("Up!"));

// test account
const accountAddress = "0x18E2633925059B6678654513Bd19B03e55e992e9";

// Collect assets on foreign chain.
// TODO: change to post
app.get(
  "/collect/:chainId/:accountAddress/:token",
  async (req: Request, res: Response) => {
    const chainId = Number(req.params.chainId);
    const accountAddress = req.params.accountAddress as Address;
    const token = req.params.token as Address; // foreign token to collect
    console.log(`[SWAPBOT] collecting ${token} on foreign chain ${chainId}`);

    const foreignSwapBot = swapBotCollective.getSwapBot(chainId);
    const collected = await foreignSwapBot.collectOnForeignChain(
      accountAddress,
      token
    );

    if (!collected) {
      return res.status(500).json({ error: "Failed to collect!" });
    }

    const { collectTxHash, homeChainId } = collected;
    res.json({
      message: "Collected from foreign chain!",
      collectTxHash,
      homeChainId,
    });

    // Receive on home chain swapbot.
  }
);

// Receive assets on home chain.
app.get(
  "/receive/:foreignChainId/:homeChainId/:txHash",
  async (req: Request, res: Response) => {
    const foreignChainId = Number(req.params.foreignChainId);
    const homeChainId = Number(req.params.homeChainId);

    const homeSwapBot = swapBotCollective.getSwapBot(homeChainId);
    const foreignSwapBot = swapBotCollective.getSwapBot(foreignChainId);

    const txHash = req.params.txHash as Hex;
    const message = await foreignSwapBot.getMessageSent(txHash);
    if (!message) return res.status(500).json({ error: "Failed to receive!" });

    console.log(`[SWAPBOT] receiving assets on home chain ${homeChainId}`);
    const unlockTxHash = await homeSwapBot.receiveOnHomeChain(message);
    if (!unlockTxHash)
      return res.status(500).json({ error: "Failed to receive!" });
    res.json({ message: "Received!", unlockTxHash });
  }
);

// Get oracle data.
app.get(
  "/oracle/:chainId/:tokenIn/:amountIn/:tokenOut/:secondsAgo",
  async (req, res) => {
    const chainId = Number(req.params.chainId);
    const tokenIn = req.params.tokenIn as Address;
    const amountIn = req.params.amountIn as BigIntStr;
    const tokenOut = req.params.tokenOut as Address;
    const secondsAgo = Number(req.params.secondsAgo);

    const swapBot = swapBotCollective.getSwapBot(chainId);
    const swapperAddress = await swapBot.getSwapperAddress(accountAddress);

    // Retrieve all oracle data.
    const result = await swapBot.getOracleData(
      tokenIn,
      BigInt(amountIn),
      tokenOut,
      secondsAgo,
      swapperAddress
    );
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }
    res.json(result);
  }
);

// Simulate swap on-chain.
app.get("/quote/:chainId/:tokenIn/:amountIn/:tokenOut", async (req, res) => {
  const chainId = Number(req.params.chainId);
  const tokenIn = req.params.tokenIn as Address;
  const amountIn = req.params.amountIn as BigIntStr;
  const tokenOut = req.params.tokenOut as Address;

  const swapBot = swapBotCollective.getSwapBot(chainId);
  const swapperAddress = await swapBot.getSwapperAddress(accountAddress);

  // Get quote swap.
  const result = await swapBot.quoteSwap({
    tokenIn,
    amountIn: BigInt(amountIn),
    tokenOut,
    swapperAddress,
  });

  res.json(result);
});

app.get("/simulate/:chainId/:tokenIn/:amountIn/:tokenOut", async (req, res) => {
  const chainId = Number(req.params.chainId);
  const tokenIn = req.params.tokenIn as Address;
  const amountIn = req.params.amountIn as BigIntStr;
  const tokenOut = req.params.tokenOut as Address;

  const swapBot = swapBotCollective.getSwapBot(chainId);
  const swapperAddress = await swapBot.getSwapperAddress(accountAddress);

  // Get quote swap.
  const quoteResult = await swapBot.quoteSwap({
    tokenIn,
    amountIn: BigInt(amountIn),
    tokenOut,
    swapperAddress,
  });
  if (
    quoteResult.error ||
    !quoteResult.finalQuote ||
    !quoteResult.finalQuote.swapPath
  ) {
    return res.status(500).json({
      message: "Unable to retrieve on-chain swap quote",
      error: quoteResult.error,
    });
  }

  // Simulate swap on-chain.
  const swapResult = await swapBot.simulateSwap({
    tokenIn,
    amountIn: BigInt(amountIn),
    tokenOut,
    swapPath: quoteResult.finalQuote.swapPath,
    accountAddress,
    swapperAddress: quoteResult.finalQuote.swapperAddress,
  });
  if (!swapResult || swapResult.error) {
    return res
      .status(500)
      .json({ message: "Simulated swap failed.", error: swapResult?.error });
  }

  res.json({
    message: "Simulated swap successful!",
    tokenIn,
    amountIn,
    tokenOut,
    amountOut: swapResult.amountOut,
  });
});

// Error handling
// Global error handlers
process.on("uncaughtException", (err) => {
  console.error("There was an uncaught error", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

app.listen(port, () => console.log(`Server is listening on port ${port}`));
module.exports = app;
