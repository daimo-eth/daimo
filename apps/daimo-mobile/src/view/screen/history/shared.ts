import {
  TransferClog,
  getForeignCoinDisplayAmount,
  isNativeETH,
} from "@daimo/common";
import { DaimoChain } from "@daimo/contract";

import { env } from "../../../env";

// Get memo text for an op
// Either uses the memo field for standard transfers, e.g. "for ice cream"
// Or generates a synthetic one for swaps, e.g. "5 USDT -> USDC" if short
// or "Accepted 5 USDT as USDC" if long
export function getSynthesizedMemo(
  op: TransferClog,
  daimoChain: DaimoChain,
  short?: boolean
) {
  const chainConfig = env(daimoChain).chainConfig;
  const coinName = chainConfig.tokenSymbol.toUpperCase();

  if (op.memo) return op.memo;
  if (op.type === "createLink" && op.noteStatus.memo) return op.noteStatus.memo;
  if (op.type === "claimLink" && op.noteStatus.memo) return op.noteStatus.memo;

  if (op.type !== "transfer" && op.type !== "swap") return null;
  if (op.type === "transfer" && op.requestStatus) {
    return op.requestStatus.memo;
  } else if (
    (op.type === "transfer" && op.preSwapTransfer) ||
    op.type === "swap"
  ) {
    // TODO: do we need to explicitly handle preSwapTransfer && "transfer" for
    // backwards compatibility?
    const fromCoin =
      op.type === "transfer" ? op.preSwapTransfer!.coin : op.coinOther;
    const fromAmount =
      op.type === "transfer" ? op.preSwapTransfer!.amount : op.amountOther;

    if (isNativeETH(fromCoin.address, chainConfig)) {
      return `ETH → ${coinName}`;
    }

    const readableAmount = getForeignCoinDisplayAmount(fromAmount, fromCoin);

    if (short) {
      return `${readableAmount} ${fromCoin.symbol} → ${coinName}`;
    } else {
      return `Accepted ${readableAmount} ${fromCoin.symbol} as ${coinName}`;
    }
  }
}
