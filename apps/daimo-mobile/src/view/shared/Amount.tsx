import { amountToDollars } from "@daimo/common";
import { getLocales } from "expo-localization";
import { StyleSheet, Text } from "react-native";

import Spacer from "./Spacer";
import { color, ss } from "./style";

/** 1.23 or 1,23 depending on user locale */
export const amountSeparator = getLocales()[0].decimalSeparator || ".";

/** Returns eg "$1.23" or "$1,23" */
export function getAmountText({
  dollars,
  amount,
  symbol,
}: {
  dollars?: `${number}`;
  amount?: bigint;
  symbol?: string;
}) {
  if (dollars == null) {
    if (amount == null) throw new Error("Missing amount");
    dollars = amountToDollars(amount);
  } else {
    if (amount != null) throw new Error("Specify amount or dollars, not both");
  }

  if (symbol == null) {
    symbol = "$";
  }
  const [wholeDollars, cents] = dollars.split(".");
  return `${symbol}${wholeDollars}${amountSeparator}${cents}`;
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
      case "h1":
        return [ss.text.h1, styles.h1Small] as const;
      case "h2":
        return [ss.text.h2, styles.h2Small] as const;
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
  h1Small: {
    fontSize: 30,
  },
  h2Small: {
    fontSize: 20,
  },
  titleGray: {
    color: color.gray,
  },
});
