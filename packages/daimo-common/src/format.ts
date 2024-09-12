import { ForeignToken } from "@daimo/contract";
import { Locale } from "expo-localization";
import { formatUnits, Hex, hexToBytes } from "viem";

import { i18n } from "./i18n";

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
  amount: `${bigint}`,
  coin: ForeignToken
) {
  const amountStr = formatUnits(BigInt(amount), coin.decimals);
  const maxDecimals = 6;
  if (coin.decimals > maxDecimals) {
    return parseFloat(amountStr).toFixed(maxDecimals);
  }
  return amountStr;
}
