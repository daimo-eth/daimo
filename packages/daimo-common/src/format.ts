import { Locale } from "expo-localization";
import { Hex, hexToBytes } from "viem";

import { i18n } from "./i18n";

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

export function hexToBuffer(hex: Hex): Buffer {
  return Buffer.from(hexToBytes(hex));
}
