import {
  ProposedSwap,
  amountToDollars,
  getForeignCoinDisplayAmount,
} from "@daimo/common";
import {
  ForeignToken,
  getChainDisplayName,
  getDAv2Chain,
} from "@daimo/contract";
import { StyleSheet, View } from "react-native";

import { i18n } from "../../../i18n";
import { TextLight } from "../../shared/text";

const i18 = i18n.routeDisplay;

export function RoutePellet({
  route,
  fromCoin,
  fromAmount,
  toCoin,
}: {
  route: ProposedSwap | null;
  fromCoin: ForeignToken;
  fromAmount: bigint;
  toCoin: ForeignToken;
}) {
  let toAmountStr: string;
  if (route == null) {
    toAmountStr = amountToDollars(fromAmount, fromCoin.decimals);
  } else if (toCoin.symbol.startsWith("USD")) {
    // TODO: isStablecoin
    toAmountStr = amountToDollars(route.toAmount, toCoin.decimals);
  } else {
    toAmountStr = getForeignCoinDisplayAmount(BigInt(route.toAmount), toCoin);
  }

  const toChain = getDAv2Chain(toCoin.chainId);
  const chainName = getChainDisplayName(toChain);

  return (
    <View style={styles.route}>
      <TextLight>
        {i18.theyWillReceive(toAmountStr, toCoin.symbol, chainName)}
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
