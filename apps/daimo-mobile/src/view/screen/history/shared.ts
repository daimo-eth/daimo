import { DisplayOpEvent, getForeignCoinDisplayAmount } from "@daimo/common";
import { DaimoChain } from "@daimo/contract";

import { env } from "../../../logic/env";

// Get memo text for an op
// Either uses the memo field for standard transfers, e.g. "for ice cream"
// Or generates a synthetic one for swaps, e.g. "5 USDT -> USDC" if short
// or "Accepted 5 USDT as USDC" if long
export function getSynthesizedMemo(
  op: DisplayOpEvent,
  daimoChain: DaimoChain,
  short?: boolean
) {
  const chainConfig = env(daimoChain).chainConfig;
  const coinName = chainConfig.tokenSymbol.toUpperCase();

  if (op.type !== "transfer") return null;
  if (op.memo) return op.memo;
  if (op.preSwapTransfer) {
    if (op.preSwapTransfer.coin.token === "ETH") {
      return `ETH → ${coinName}`;
    }

    const readableAmount = getForeignCoinDisplayAmount(
      op.preSwapTransfer.amount,
      op.preSwapTransfer.coin
    );
    if (short) {
      return `${readableAmount} ${op.preSwapTransfer.coin.symbol} → ${coinName}`;
    } else {
      return `Accepted ${readableAmount} ${op.preSwapTransfer.coin.symbol} as ${coinName}`;
    }
  }
}
