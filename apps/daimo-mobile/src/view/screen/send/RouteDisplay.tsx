import { ForeignCoin, ProposedSwap, amountToDollars } from "@daimo/common";
import { View, StyleSheet } from "react-native";

import { TextLight } from "../../shared/text";

export function RoutePellet({
  route,
  fromCoin,
  toCoin,
}: {
  route: ProposedSwap;
  fromCoin: ForeignCoin;
  toCoin: ForeignCoin;
}) {
  const toAmount = amountToDollars(route.toAmount, toCoin.decimals);

  return (
    <View style={styles.route}>
      <TextLight style={{ fontSize: 14 }}>
        They will receive {toAmount} {toCoin.symbol}
      </TextLight>
    </View>
  );
}

const styles = StyleSheet.create({
  route: {
    display: "flex",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
