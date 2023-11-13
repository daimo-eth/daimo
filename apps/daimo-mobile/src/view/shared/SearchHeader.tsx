import { EAccount } from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import { ReactNode, RefObject, useCallback } from "react";
import { StyleSheet, TextInput, TouchableHighlight, View } from "react-native";

import { AccountBubble } from "./AccountBubble";
import { InputBig } from "./InputBig";
import { useNav } from "./nav";
import { color, touchHighlightUnderlay } from "./style";
import { useAccount } from "../../model/account";

/** Prefix is undefined when not focused, "" or longer when focused. */
export function SearchHeader({
  prefix,
  setPrefix,
  innerRef,
}: {
  prefix?: string;
  setPrefix: (prefix?: string) => void;
  innerRef?: RefObject<TextInput>;
}) {
  const nav = useNav();

  // Left side: account bubble
  const goToAccount = useCallback(
    () => nav.navigate("SettingsTab", { screen: "Settings" }),
    [nav]
  );

  // Right: QR code
  const goToQR = useCallback(
    () => nav.navigate("HomeTab", { screen: "QR" }),
    [nav]
  );

  const [account] = useAccount();
  if (account == null) return null;
  const eAcc: EAccount = { addr: account.address, name: account.name };

  return (
    <View style={styles.header}>
      <ButtonCircle onPress={goToAccount}>
        <AccountBubble eAcc={eAcc} size={50} transparent />
      </ButtonCircle>
      <InputBig
        icon="search"
        placeholder="Search for user..."
        value={prefix || ""}
        onChange={setPrefix}
        onFocus={() => setPrefix("")}
        onBlur={() => setPrefix(undefined)}
        innerRef={innerRef}
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
      hitSlop={12}
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
  },
  buttonCircle: {
    width: 50,
    height: 50,
    borderRadius: 50,
    margin: 12,
  },
  qrCircle: {
    width: 50,
    height: 50,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: color.grayLight,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
});
