import { ForeignCoin, ProposedSwap, amountToDollars } from "@daimo/common";
import { Text, View, StyleSheet } from "react-native";

export function RoutePellet({
  route,
  fromCoin,
  toCoin,
}: {
  route: ProposedSwap;
  fromCoin: ForeignCoin;
  toCoin: ForeignCoin;
}) {
  const fromAmount = amountToDollars(
    BigInt(route.fromAmount),
    fromCoin.decimals
  );
  const toAmount = amountToDollars(route.toAmount, toCoin.decimals);

  return (
    <View style={styles.route}>
      <Text>
        You send {fromAmount} {fromCoin.symbol}. They receive {toAmount}{" "}
        {toCoin.symbol}.
      </Text>
    </View>
  );
}

export function RouteLoading() {
  return (
    <View style={styles.route}>
      <Text>Computing route...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  route: {
    display: "flex",
    padding: 8,
    backgroundColor: "#eee",
    borderRadius: 8,
  },
});
