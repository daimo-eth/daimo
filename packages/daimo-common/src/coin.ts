import { tokenMetadata } from "@daimo/contract";
import { parseUnits } from "viem";

/** Returns token units, 6000000 for $6 USDC */
export function dollarsToAmount(dollars: number) {
  return parseUnits(`${dollars}`, tokenMetadata.decimals);
}

/** Returns eg "6.00" for 6000000 USDC units. */
export function amountToDollars(amount: bigint | number): `${number}` {
  const dispDecimals = 2;
  const { decimals } = tokenMetadata;

  const totalCents = BigInt(amount) / BigInt(10 ** (decimals - dispDecimals));
  const dispStr = totalCents.toString().padStart(dispDecimals + 1, "0");
  const dollars = dispStr.slice(0, -dispDecimals);
  const cents = dispStr.slice(-dispDecimals);

  return `${dollars}.${cents}` as `${number}`;
}
