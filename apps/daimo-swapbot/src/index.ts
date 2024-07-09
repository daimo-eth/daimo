import { BigIntStr } from "@daimo/common";
import * as bodyParser from "body-parser";
import * as dotenv from "dotenv";
import express, { Request, Response } from "express";
import { Address, Hex } from "viem";

import { SwapBot } from "./swapbot";

dotenv.config();

const app = express();
app.use(express.json());

const port = 3008;

// Set up swappy the swapbot.
const swapbot = new SwapBot();

app.use(bodyParser.json());
app.get("/health", (req: Request, res: Response) => res.send("Up!"));

/** Collect assets on foreign chain. */
app.post("/collect", async (req: Request, res: Response) => {
  const chainId = Number(req.query.chainId);
  const accountAddress = req.query.accountAddress as Address;
  const token = req.query.token as Address;

  console.log(`[SWAPBOT] collecting ${token} on foreign chain ${chainId}`);
  try {
    const collected = await swapbot.collect({
      foreignChainId: chainId,
      accountAddress,
      tokenForeign: token,
    });
    if (!collected) {
      return res.status(500).json({ error: "Failed to collect!" });
    }

    res.json({
      message: "Collected from foreign chain!",
      foreignChainId: chainId,
      collectTxHash: collected.collectTxHash,
      homeChainId: collected.homeChainId,
    });
  } catch (e) {
    return res.status(500).json({ error: "Failed to collect!", e });
  }
});

/** Receive assets on home chain. */
app.post("/receive", async (req: Request, res: Response) => {
  const foreignChainId = Number(req.query.foreignChainId);
  const homeChainId = Number(req.query.homeChainId);
  const txHash = req.query.txHash as Hex;

  // Get the CCTP message from the foreign chain.
  const message = await swapbot.getMessageSent(foreignChainId, txHash);
  if (!message)
    return res.status(500).json({ error: "Failed to fetch CCTP message!" });

  // Receive the assets on the home chain.
  console.log(`[SWAPBOT] receiving assets on home chain ${homeChainId}`);
  const unlockTxHash = await swapbot.receive(homeChainId, message);
  if (!unlockTxHash)
    return res.status(500).json({ error: "Failed to receive!" });

  res.json({ message: "Received!", unlockTxHash });
});

/** Fast Finish CCTP on the home chain. */
app.post("/fastcctp", async (req: Request, res: Response) => {
  const fromChainId = Number(req.query.fromChainId);
  const fromAddr = req.query.fromAddr as Address;
  const fromAmount = BigInt(Number(req.query.fromAmount));
  const toChainId = Number(req.query.toChainId);
  const toAddr = req.query.toAddr as Address;
  const toToken = req.query.toToken as Address;
  const toAmount = BigInt(Number(req.query.toAmount));
  const nonce = BigInt(Number(req.query.nonce));

  try {
    const fastFinishTxHash = await swapbot.fastCCTPFinish({
      fromChainId,
      fromAddr,
      fromAmount,
      toChainId,
      toAddr,
      toToken,
      toAmount,
      nonce,
    });
    res.json({ message: "FastFinish transfer initiated!", fastFinishTxHash });
  } catch (e) {
    return res.status(500).json({ error: "Failed to fastFinish!", e });
  }
});

/** Retrieve on-chain quote: (tokenIn, amountIn) --> (tokenOut, amountOut). */
app.get("/quote/:chainId/:tokenIn/:amountIn/:tokenOut", async (req, res) => {
  const chainId = Number(req.params.chainId);
  const tokenIn = req.params.tokenIn as Address;
  const amountIn = req.params.amountIn as BigIntStr;
  const tokenOut = req.params.tokenOut as Address;

  // Get quote swap.
  const result = await swapbot.readQuoteSwap({
    chainId,
    tokenIn,
    amountIn: BigInt(amountIn),
    tokenOut,
  });

  res.json(result);
});

// Global error handlers
process.on("uncaughtException", (err) => {
  console.error("There was an uncaught error", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

app.listen(port, () => console.log(`Server is listening on port ${port}`));
module.exports = app;
