import { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ButtonSmall } from "./Button";
import { useNav } from "./nav";
import { color, ss } from "./style";
import { TextH3 } from "./text";
import { useAccount } from "../../model/account";

export function Header() {
  const nav = useNav();
  const goToAccount = useCallback(() => nav.navigate("Settings"), [nav]);

  const [account] = useAccount();
  const accountName = account?.name || "⚠️";

  return (
    <ButtonSmall onPress={goToAccount}>
      <View style={styles.header}>
        <TextH3>{accountName}</TextH3>
        <StyleTBD />
      </View>
    </ButtonSmall>
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
