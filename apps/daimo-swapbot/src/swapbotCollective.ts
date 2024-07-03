import { arbitrum, avalanche, base, optimism, polygon } from "@daimo/common";

import { SwapBot } from "./swapbot";

/*
 * The swapbot collective coordinates the swapbots.
 */
export class SwapBotCollective {
  private swapBots: SwapBot[] = [];

  constructor() {
    for (const chainId of [
      base.chainId,
      optimism.chainId,
      avalanche.chainId,
      polygon.chainId,
      arbitrum.chainId,
    ]) {
      const swapBot = new SwapBot(chainId);
      this.swapBots.push(swapBot);
    }
  }

  getSwapBot(chainId: number): SwapBot {
    const swapBot = this.swapBots.find((bot) => bot.chain.id === chainId);
    if (!swapBot) throw new Error(`No swapbot for chain ${chainId}`);
    return swapBot;
  }
}
