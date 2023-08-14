import { useCallback, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "./Button";
import Spacer from "./Spacer";
import { useNav } from "./nav";
import { color, ss } from "./style";
import { TextH3 } from "./text";
import { useAccount } from "../../model/account";

export function Header() {
  const nav = useNav();
  const goToAccount = useCallback(() => nav.navigate("Settings"), [nav]);

  const [account] = useAccount();

  const buttonStyle = useRef({ button: styles.button, title: {} });

  return (
    <Button onPress={goToAccount} style={buttonStyle.current}>
      <View style={styles.header}>
        <TextH3>
          <Spacer w={8} />
          {account?.name || "⚠️"}
        </TextH3>
        <StyleTBD />
      </View>
    </Button>
  );
}

function StyleTBD() {
  return (
    <View style={styles.pellet}>
      <Text style={styles.pelletText}>DESIGN TBD</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  pellet: {
    borderRadius: 4,
    backgroundColor: color.bg.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pelletText: {
    ...ss.text.body,
    fontWeight: "bold",
    color: color.gray,
  },
});
