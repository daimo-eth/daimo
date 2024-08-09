import {
  DAv2Chain,
  ForeignToken,
  ProposedSwap,
  amountToDollars,
  getChainDisplayName,
} from "@daimo/common";
import { View, StyleSheet } from "react-native";

import { i18n } from "../../../i18n";
import { TextLight } from "../../shared/text";

const i18 = i18n.routeDisplay;

export function RoutePellet({
  route,
  fromCoin,
  fromAmount,
  toChain,
  toCoin,
}: {
  route: ProposedSwap | null;
  fromCoin: ForeignToken;
  fromAmount: bigint;
  toChain: DAv2Chain;
  toCoin: ForeignToken;
}) {
  const toAmount = route
    ? amountToDollars(route.toAmount, toCoin.decimals)
    : amountToDollars(fromAmount, fromCoin.decimals);

  const chainName = getChainDisplayName(toChain, true);

  return (
    <View style={styles.route}>
      <TextLight>
        {i18.theyWillReceive(toAmount, toCoin.symbol, chainName)}
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
