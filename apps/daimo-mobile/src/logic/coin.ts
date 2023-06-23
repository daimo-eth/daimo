import { tokenMetadata } from "@daimo/contract";
import { parseUnits } from "viem";

/** Returns token units, 6000000 for $6 USDC */
export function dollarsToAmount(dollars: number) {
  return parseUnits(`${dollars}`, tokenMetadata.decimals);
}

/** Returns eg "6.00" for 6000000 USDC units. */
export function amountToDollars(amount: bigint): string {
  const displayDecimals = 2;
  const { decimals } = tokenMetadata;

  const totalCents = amount / BigInt(10 ** (decimals - displayDecimals));
  const dispStr = totalCents.toString().padStart(displayDecimals + 1, "0");
  const dollars = dispStr.slice(0, -displayDecimals);
  const cents = dispStr.slice(-displayDecimals);

  return `${dollars}.${cents}`;
}
