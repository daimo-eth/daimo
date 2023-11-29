import { parseUnits } from "viem";

/** Returns token units, 6000000 for $6 USDC */
export function dollarsToAmount(
  dollars: number | string,
  tokenDecimals: number = 6
) {
  if (typeof dollars === "number") {
    dollars = dollars.toFixed(tokenDecimals);
  }
  return parseUnits(dollars, tokenDecimals);
}

/** Returns eg "6.00" for 6000123 USDC units. */
export function amountToDollars(
  amount: bigint | number,
  tokenDecimals: number = 6
): `${number}` {
  const dispDecimals = 2;

  const totalCents =
    BigInt(amount) / BigInt(10 ** (tokenDecimals - dispDecimals));
  const dispStr = totalCents.toString().padStart(dispDecimals + 1, "0");
  const dollars = dispStr.slice(0, -dispDecimals);
  const cents = dispStr.slice(-dispDecimals);

  return `${dollars}.${cents}` as `${number}`;
}
