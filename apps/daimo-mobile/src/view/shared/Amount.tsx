import { StyleSheet, Text } from "react-native";

import Spacer from "./Spacer";
import { color } from "./style";
import { TextH1 } from "./text";

export function TitleAmount({
  symbol,
  amount,
  decimals,
  displayDecimals,
}: {
  symbol: string;
  amount: bigint;
  decimals: number;
  displayDecimals: number;
}) {
  if (!(amount >= 0)) throw new Error("Invalid amount");

  amount = amount / BigInt(10 ** (decimals - displayDecimals));
  const dispStr = amount.toString().padStart(displayDecimals + 1, "0");
  const dollars = dispStr.slice(0, -displayDecimals);
  const cents = dispStr.slice(-displayDecimals);

  return (
    <TextH1>
      <Text style={styles.titleSmall}>{symbol}</Text>
      <Spacer w={4} />
      {dollars}
      <Text style={styles.titleGray}>.{cents}</Text>
    </TextH1>
  );
}

const styles = StyleSheet.create({
  titleSmall: {
    fontSize: 30,
  },
  titleGray: {
    color: color.gray,
  },
});
