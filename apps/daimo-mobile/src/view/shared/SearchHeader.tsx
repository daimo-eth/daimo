import { EAccount } from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import { ReactNode, useCallback } from "react";
import { StyleSheet, TouchableHighlight, View } from "react-native";

import { AccountBubble } from "./AccountBubble";
import { InputBig } from "./InputBig";
import { useNav } from "./nav";
import { color, touchHighlightUnderlay } from "./style";
import { useAccount } from "../../model/account";

/** Prefix is undefined when not focused, "" or longer when focused. */
export function SearchHeader({
  prefix,
  setPrefix,
}: {
  prefix?: string;
  setPrefix: (prefix?: string) => void;
}) {
  const nav = useNav();

  // Left side: account bubble
  const goToAccount = useCallback(
    () => nav.navigate("SettingsTab", { screen: "Settings" }),
    [nav]
  );

  // Right: QR code
  const goToQR = useCallback(
    () => nav.navigate("ReceiveTab", { screen: "Request" }),
    [nav]
  );

  const [account] = useAccount();
  if (account == null) return null;
  const eAcc: EAccount = { addr: account.address, name: account.name };

  return (
    <View style={styles.header}>
      <ButtonCircle onPress={goToAccount}>
        <AccountBubble eAcc={eAcc} size={50} />
      </ButtonCircle>
      <InputBig
        icon="search"
        placeholder="Search for user..."
        value={prefix || ""}
        onChange={setPrefix}
        onFocus={() => setPrefix("")}
        onBlur={() => setPrefix(undefined)}
      />
      <ButtonCircle onPress={goToQR}>
        <View style={styles.qrCircle}>
          <Octicons name="apps" size={24} color={color.midnight} />
        </View>
      </ButtonCircle>
    </View>
  );
}

function ButtonCircle({
  onPress,
  children,
}: {
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <TouchableHighlight
      onPress={onPress}
      style={styles.buttonCircle}
      {...touchHighlightUnderlay.subtle}
    >
      {children}
    </TouchableHighlight>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: -12,
  },
  buttonCircle: {
    width: 74,
    height: 74,
    borderRadius: 50,
    padding: 12,
  },
  qrCircle: {
    width: 50,
    height: 50,
    borderRadius: 50,
    backgroundColor: color.white,
    borderWidth: 1,
    borderColor: color.grayLight,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
});
