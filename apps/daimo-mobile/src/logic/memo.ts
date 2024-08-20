import { MoneyEntry } from "./moneyEntry";

/** Reterns eg "foo", "€1.23", or "€1.23 · foo". */
export function getFullMemo(
  memo: string | undefined,
  money: MoneyEntry
): string {
  const memoParts = [] as string[];
  if (money.currency.currency !== "USD") {
    memoParts.push(
      `${money.currency.symbol}${money.localUnits.toFixed(
        money.currency.decimals
      )}`
    );
  }
  if (memo != null) {
    memoParts.push(memo);
  }
  return memoParts.join(" · ");
}
