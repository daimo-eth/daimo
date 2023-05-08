import { useContext, useState } from "react";
import { StyleSheet, Text, TouchableHighlight, View } from "react-native";

import { color } from "./style";
import { ChainContext } from "../../logic/chain";
import { ChainScreen } from "../screen/ChainScreen";
import { UserScreen } from "../screen/UserScreen";

export function Header() {
  // TODO: expo router
  const [show, setShow] = useState<string>();

  return (
    <>
      <View style={styles.header}>
        <TouchableHighlight onPress={() => setShow(show ? undefined : "user")}>
          <Text style={styles.headerText}>
            dcposch
            <Text style={styles.headerLight}>.daimo.eth</Text>
          </Text>
        </TouchableHighlight>
        <Indicator onPress={() => setShow(show ? undefined : "chain")} />
      </View>

      {show === "user" && <UserScreen />}
      {show === "chain" && <ChainScreen />}
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
    <TouchableHighlight onPress={onPress}>
      <View style={[styles.indicator, { backgroundColor }]} />
    </TouchableHighlight>
  );
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
