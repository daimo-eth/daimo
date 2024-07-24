import { Hex, hexToBytes } from "viem";

// Returns eg "$0.42 fee" or null if no fee
export function formatFeeAmountOrNull(dollars: number): string | null {
  if (dollars < 0) throw new Error("Negative fee");
  const amount = dollars.toFixed(2);
  if (amount === "0.00") return null;
  return `Fee: $${amount}`;
}

export function hexToBuffer(hex: Hex): Buffer {
  return Buffer.from(hexToBytes(hex));
}
