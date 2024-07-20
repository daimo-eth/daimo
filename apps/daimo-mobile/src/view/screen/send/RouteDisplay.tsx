import { ForeignToken, ProposedSwap, amountToDollars } from "@daimo/common";
import { View, StyleSheet } from "react-native";

import { i18n } from "../../../i18n";
import { TextLight } from "../../shared/text";

const i18 = i18n.routeDisplay;

export function RoutePellet({
  route,
  fromCoin,
  toCoin,
}: {
  route: ProposedSwap;
  fromCoin: ForeignToken;
  toCoin: ForeignToken;
}) {
  const toAmount = amountToDollars(route.toAmount, toCoin.decimals);

  return (
    <View style={styles.route}>
      <TextLight>{i18.theyWillReceive(toAmount, toCoin.symbol)}</TextLight>
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
