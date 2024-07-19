import { ForeignToken, ProposedSwap, amountToDollars } from "@daimo/common";
import { View, StyleSheet } from "react-native";

import { useI18n } from "../../../logic/i18n";
import { TextLight } from "../../shared/text";

export function RoutePellet({
  route,
  fromCoin,
  toCoin,
}: {
  route: ProposedSwap;
  fromCoin: ForeignToken;
  toCoin: ForeignToken;
}) {
  const i18n = useI18n().routeDisplay;
  const toAmount = amountToDollars(route.toAmount, toCoin.decimals);

  return (
    <View style={styles.route}>
      <TextLight>
        {i18n.theyWillReceive({ amount: toAmount, tokenSymbol: toCoin.symbol })}
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
