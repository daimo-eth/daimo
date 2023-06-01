import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { ReactNode, useCallback, useContext } from "react";
import { StyleSheet, Text, TouchableHighlight, View } from "react-native";

import { ChainContext } from "../../logic/chain";
import { HomeStackParamList } from "../HomeStack";
import { color, touchHighlightUnderlay } from "./style";

export function Header() {
  const nav = useNavigation<StackNavigationProp<HomeStackParamList>>();
  const { name } = useRoute<RouteProp<HomeStackParamList>>();
  const goHome = useCallback(() => nav.navigate("User"), [nav]);
  const goToUser = useCallback(() => nav.navigate("User"), [nav]);
  const goToChain = useCallback(() => nav.navigate("Chain"), [nav]);

  return (
    <>
      <View style={styles.header}>
        <Button onPress={name === "User" ? goHome : goToUser}>
          <Text style={styles.headerText}>
            dcposch
            <Text style={styles.headerLight}>.daimo.eth</Text>
          </Text>
        </Button>
        <Indicator onPress={name === "Chain" ? goHome : goToChain} />
      </View>
    </>
  );
}

/** Circle indicator, green if connected to the chain. */
function Indicator({ onPress }: { onPress?: () => void }) {
  const { status } = useContext(ChainContext);

  const backgroundColor = (function () {
    switch (status?.status) {
      case "ok":
        return color.status.green;
      case "error":
        return color.status.red;
      default:
        return color.gray;
    }
  })();

  return (
    <Button onPress={onPress}>
      <View style={[styles.indicator, { backgroundColor }]} />
    </Button>
  );
}

function Button({
  children,
  onPress,
}: {
  children: ReactNode;
  onPress: () => void;
}) {
  return (
    <TouchableHighlight
      onPress={onPress}
      style={styles.button}
      {...touchHighlightUnderlay}
    >
      {children}
    </TouchableHighlight>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  headerLight: {
    color: color.gray,
  },
  indicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
});
