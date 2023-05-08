import { useContext } from "react";
import { StyleSheet, Text, View } from "react-native";

import { color } from "./style";
import { ChainContext } from "../../logic/chain";

export function Header() {
  return (
    <View style={styles.header}>
      <Text style={styles.headerText}>
        dcposch
        <Text style={styles.headerLight}>.daimo.eth</Text>
      </Text>
      <Indicator />
    </View>
  );
}

/** Circle indicator, green if connected to the chain. */
function Indicator() {
  const { status } = useContext(ChainContext);
  if (!status) return null;

  const backgroundColor = (function () {
    switch (status.status) {
      case "ok":
        return color.status.green;
      case "error":
        return color.status.red;
      default:
        return color.gray;
    }
  })();

  return <View style={[styles.indicator, { backgroundColor }]} />;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    padding: 4,
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
