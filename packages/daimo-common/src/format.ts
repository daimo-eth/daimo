// Returns eg "$0.42 fee" or null if no fee
export function formatFeeAmountOrNull(dollars: number): string | null {
  if (dollars < 0) throw new Error("Negative fee");
  const str = `${dollars.toFixed(2)}`;
  if (str === "0.00") return null;
  return str;
}
