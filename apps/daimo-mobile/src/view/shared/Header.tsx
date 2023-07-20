import { ReactNode, useCallback } from "react";
import { StyleSheet, TouchableHighlight, View } from "react-native";

import { useNav } from "./nav";
import { color, touchHighlightUnderlay } from "./style";
import { TextH3 } from "./text";
import { useAccount } from "../../model/account";

export function Header() {
  const nav = useNav();
  const goToAccount = useCallback(() => nav.navigate("Account"), [nav]);

  const [account] = useAccount();

  return (
    <View style={styles.header}>
      <Button onPress={goToAccount}>
        <TextH3>{account?.name || "⚠️"}</TextH3>
      </Button>
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
  headerLight: {
    color: color.gray,
  },
  indicator: {
    width: 18,
    height: 18,
    borderRadius: 4,
  },
});
