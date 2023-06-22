import { tokenMetadata } from "@daimo/contract";
import { StyleSheet, Text } from "react-native";

import Spacer from "./Spacer";
import { color, ss } from "./style";
import { TextH1 } from "./text";

export function TitleAmount({
  amount,
  size,
}: {
  amount: bigint;
  size?: "h1" | "h2";
}) {
  if (!(amount >= 0)) throw new Error("Invalid amount");

  const symbol = "$";
  const decimals = tokenMetadata.decimals;
  const displayDecimals = 2;

  amount = amount / BigInt(10 ** (decimals - displayDecimals));
  const dispStr = amount.toString().padStart(displayDecimals + 1, "0");
  const dollars = dispStr.slice(0, -displayDecimals);
  const cents = dispStr.slice(-displayDecimals);

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
      <Text style={styles.titleGray}>.{cents}</Text>
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
