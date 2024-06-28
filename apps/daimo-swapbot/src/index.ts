import { TokenRegistry } from "@daimo/api/src/server/tokenRegistry";
import { optimism } from "@daimo/common";
import * as bodyParser from "body-parser";
import * as dotenv from "dotenv";
import express, { Request, Response } from "express";
import { Address } from "viem";

import { SwapBot } from "./swapbot";

dotenv.config();

const app = express();
const port = 3008;

const accountAddress = process.env.DAIMO_SWAPBOT_ACCOUNT_ADDRESS as Address;
const foreignChain = optimism; // Launch swap bot on foreign chain.

// Setup swap bot on foreign chain.
const swapBot = new SwapBot(new TokenRegistry(), foreignChain.chainId);
swapBot.setupListeners(accountAddress);

app.use(bodyParser.json());
app.get("/health", (req: Request, res: Response) => res.send("Up!"));

// Initiate bridge from foreign chain
app.get("/bridge", (req: Request, res: Response) => {
  swapBot.initiateBridge(accountAddress, foreignChain.chainId);
  res.send("Swapped!");
});

app.listen(port, () => console.log(`Server is listening on port ${port}`));
module.exports = app;
