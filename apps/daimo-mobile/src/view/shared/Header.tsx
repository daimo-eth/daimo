import { chainConfig } from "@daimo/contract";
import { useCallback } from "react";
import { StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";

import { ButtonSmall } from "./Button";
import { useNav } from "./nav";
import { color, ss } from "./style";
import { TextH3 } from "./text";
import { useAccount } from "../../model/account";

export function Header() {
  const nav = useNav();
  const goToAccount = useCallback(
    () => nav.navigate("SettingsTab", { screen: "Settings" }),
    [nav]
  );

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
  const { testnet } = chainConfig.chainL2;
  const stylePellet = [styles.pellet] as ViewStyle[];
  const styleText = [styles.pelletText] as TextStyle[];
  let text;
  if (testnet) {
    stylePellet.push({ backgroundColor: color.primaryBgLight });
    styleText.push({ color: color.grayDark });
    text = "TESTNET";
  } else {
    text = "MAINNET";
  }
  return (
    <View style={stylePellet}>
      <Text style={styleText}>{text}</Text>
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
    backgroundColor: color.ivoryDark,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pelletText: {
    ...ss.text.body,
    fontWeight: "bold",
    color: color.grayMid,
  },
});
