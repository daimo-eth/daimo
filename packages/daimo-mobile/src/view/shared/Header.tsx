import { StyleSheet, Text, View } from "react-native";

import { color } from "./style";

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
  return <View style={styles.indicator} />;
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
    backgroundColor: color.status.green,
  },
});
