import {
  ChainConfig,
  ForeignToken,
  getChainDisplayName,
  getDAv2Chain,
} from "@daimo/contract";
import { Locale } from "expo-localization";
import { formatUnits, Hex, hexToBytes } from "viem";

import { i18n } from "./i18n";
import { MoneyEntry } from "./moneyEntry";
import { TransferClog } from "./op";

/** Viem hexToBytes, wrapped in a Buffer instead of Uint8Array */
export function hexToBuffer(hex: Hex): Buffer {
  return Buffer.from(hexToBytes(hex));
}

// Returns eg "$0.42 fee" or null if no fee
export function formatFeeAmountOrNull(
  locale: Locale,
  dollars: number
): string | null {
  const i18 = i18n(locale).format;
  if (dollars < 0) throw new Error("Negative fee");
  const amount = dollars.toFixed(2);
  if (amount === "0.00") return null;
  return `${i18.fee()}: ${amount}`;
}

/** Formats an amount for a non-USD token, eg "123.000000" */
export function getForeignCoinDisplayAmount(
  amount: `${bigint}` | bigint,
  coin: ForeignToken
) {
  const amountStr = formatUnits(BigInt(amount), coin.decimals);
  const maxDecimals = 6;
  if (coin.decimals > maxDecimals) {
    return parseFloat(amountStr).toFixed(maxDecimals);
  }
  return amountStr;
}

/**
 * Creates a complete memo, eg:
 * Send to non-stablecoin: "USDC → 0.0017 ETH"
 * Send cross-chain: "USDC Poly"
 * Non-USD amount entry + memo + cross-chain: "ARS234 · Test 234 · USDC Poly"
 */
export function getFullMemo({
  memo,
  money,
}: {
  /** User-entered memo, if any. */
  memo?: string;
  /** User-entered amount. */
  money: MoneyEntry;
}) {
  const parts: string[] = [];
  if (memo != null) {
    parts.push(memo); // "Dinner"
  }
  const { currency, symbol, decimals } = money.currency;
  if (currency !== "USD") {
    parts.push(`${symbol}${money.localUnits.toFixed(decimals)}`); // "€9.90"
  }
  return parts.join(" · ");
}

// Summarizes a transfer clog.
// Either uses the memo field for standard transfers, e.g. "for ice cream"
// Or generates a synthetic one for swaps, e.g. "5 USDT -> USDC" if short
// or "Accepted 5 USDT as USDC" if long.
export function getTransferSummary(
  op: TransferClog,
  chainConfig: ChainConfig,
  locale?: Locale,
  short?: boolean
) {
  const i18 = i18n(locale).op;
  // TODO: use home coin from account
  const homeCoinSymbol = chainConfig.tokenSymbol.toUpperCase();
  let memo;

  if (op.memo) memo = op.memo;
  if (op.type === "createLink" && op.noteStatus.memo) return op.noteStatus.memo;
  if (op.type === "claimLink" && op.noteStatus.memo) return op.noteStatus.memo;

  if (op.type === "transfer" && op.requestStatus) {
    return op.requestStatus.memo;
  } else if (op.type === "transfer" && op.preSwapTransfer) {
    const { amount, coin } = op.preSwapTransfer;
    const readableAmount = getForeignCoinDisplayAmount(amount, coin);

    // inbound cross-chain transfer
    if (coin.chainId !== chainConfig.chainL2.id) {
      const crossChain = getChainDisplayName(getDAv2Chain(coin.chainId));
      return short
        ? `${homeCoinSymbol} ${crossChain}`
        : i18.acceptedInbound(
            readableAmount,
            coin.symbol,
            homeCoinSymbol,
            crossChain
          );
    }

    // inbound swap
    return short
      ? `${readableAmount} ${coin.symbol} → ${homeCoinSymbol}`
      : i18.acceptedInbound(readableAmount, coin.symbol, homeCoinSymbol);
  } else if (op.type === "transfer" && op.postSwapTransfer) {
    const { amount, coin } = op.postSwapTransfer;
    const readableAmount = getForeignCoinDisplayAmount(amount, coin);

    // outbound cross-chain transfer
    if (coin.chainId !== chainConfig.chainL2.id) {
      const toChain = getDAv2Chain(coin.chainId);
      const crossChain = getChainDisplayName(toChain);
      const crossChainShort = getChainDisplayName(toChain, true);
      if (short && memo != null) {
        return `${memo} · ${homeCoinSymbol} ${crossChainShort}`;
      } else if (short) {
        return `${homeCoinSymbol} ${crossChain}`;
      } else {
        return i18.sentOutbound(readableAmount, coin.symbol, crossChain);
      }
    }

    // oubound swap
    return short
      ? `${homeCoinSymbol} → ${readableAmount} ${coin.symbol}`
      : i18.sentOutbound(readableAmount, coin.symbol);
  }
  return memo;
}
