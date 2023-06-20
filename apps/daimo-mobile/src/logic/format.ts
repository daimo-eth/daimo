import { tokenMetadata } from "@daimo/contract";
import { formatUnits } from "viem";

/** Formats stablecoin units as "$1.23" */
export function formatDollars(value: bigint) {
  const { decimals } = tokenMetadata;
  const rawAmount = formatUnits(value, decimals);
  const dollars = Math.abs(Number(rawAmount)).toFixed(2);
  return dollars;
}
