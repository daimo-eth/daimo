import { ReactNode, useCallback } from "react";
import { StyleSheet, TouchableHighlight, View, Text } from "react-native";

import { useNav } from "./nav";
import { color, ss, touchHighlightUnderlay } from "./style";
import { TextH3 } from "./text";
import { useAccount } from "../../model/account";

export function Header() {
  const nav = useNav();
  const goToAccount = useCallback(() => nav.navigate("Account"), [nav]);

  const [account] = useAccount();

  return (
    <Button onPress={goToAccount}>
      <View style={styles.header}>
        <TextH3>{account?.name || "⚠️"}</TextH3>
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

function Button({
  children,
  onPress,
}: {
  children: ReactNode;
  onPress?: () => void;
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
