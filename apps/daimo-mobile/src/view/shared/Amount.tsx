import { amountToDollars } from "@daimo/common";
import { getLocales } from "expo-localization";
import { StyleSheet, Text } from "react-native";

import Spacer from "./Spacer";
import { color } from "./style";

/** 1.23 or 1,23 depending on user locale */
const amountSeparator = getLocales()[0].decimalSeparator || ".";

/** Returns eg "$1.00" or "$1,23" or "$1.2345" */
export function getAmountText({
  dollars,
  amount,
  symbol,
  fullPrecision,
}: {
  dollars?: `${number}` | number;
  amount?: bigint;
  symbol?: string;
  fullPrecision?: boolean;
}) {
  if (dollars == null) {
    if (amount == null) throw new Error("Missing amount");
    // Amount specified, calculate dollars string
    dollars = amountToDollars(amount);
  } else if (amount == null) {
    // Dollars specified, normalize to string
    if (typeof dollars === "number") {
      dollars = dollars.toFixed(2) as `${number}`;
    }
  } else {
    throw new Error("Specify amount or dollars, not both");
  }

  if (symbol == null) {
    symbol = "$";
  }
  const [wholeDollars, cents] = dollars.split(".");
  const dispCents = fullPrecision ? cents : cents.slice(0, 2);
  return `${symbol}${wholeDollars}${amountSeparator}${dispCents}`;
}

/** Displays eg "$1.23" or "$1,23" as H1 or H2. */
export function TitleAmount({
  amount,
  size,
}: {
  amount: bigint;
  size?: "h1" | "h2";
}) {
  if (!(amount >= 0)) throw new Error("Invalid amount");

  const symbol = "$";
  const [dollars, cents] = amountToDollars(amount).split(".");

  const [style, styleSym] = (() => {
    switch (size) {
      default:
        return [styles.hero, styles.heroSmall] as const;
    }
  })();
  return (
    <Text style={style}>
      <Text style={styleSym}>{symbol}</Text>
      <Spacer w={4} />
      {dollars}
      <Text style={styles.titleGray}>
        {amountSeparator}
        {cents}
      </Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  hero: {
    fontSize: 48,
    fontVariant: ["tabular-nums"],
    color: color.midnight,
    fontWeight: "600",
    textAlign: "center",
  },
  heroSmall: {
    fontSize: 42,
  },
  titleGray: {
    color: color.grayMid,
  },
});
