import { EAccount } from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import { RefObject, useCallback } from "react";
import { Keyboard, StyleSheet, TextInput, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";

import { AccountBubble } from "./AccountBubble";
import { ButtonCircle } from "./ButtonCircle";
import { InputBig } from "./InputBig";
import { useNav } from "./nav";
import { color } from "./style";
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
  const isFocused = prefix != null;
  const nav = useNav();

  // Left side: account bubble
  const goToAccount = useCallback(
    () => nav.navigate("SettingsTab", { screen: "Settings" }),
    [nav]
  );

  // Right: QR code
  const goToQR = useCallback(
    () =>
      nav.navigate("HomeTab", { screen: "QR", params: { option: undefined } }),
    [nav]
  );

  const [account] = useAccount();
  if (account == null) return null;
  const eAcc: EAccount = { addr: account.address, name: account.name };

  return (
    <View style={styles.header}>
      <View style={styles.leftButtonWrapper}>
        {isFocused ? (
          <View key="back">
            <TouchableOpacity onPress={() => Keyboard.dismiss()} hitSlop={16}>
              <Octicons name="arrow-left" size={30} color={color.midnight} />
            </TouchableOpacity>
          </View>
        ) : (
          <View key="icon">
            <ButtonCircle size={50} onPress={goToAccount}>
              <AccountBubble eAcc={eAcc} size={50} fontSize={20} transparent />
            </ButtonCircle>
          </View>
        )}
      </View>
      <InputBig
        icon="search"
        placeholder="Search for user..."
        value={prefix || ""}
        onChange={setPrefix}
        onFocus={() => setPrefix("")}
        onBlur={() => setPrefix(undefined)}
        innerRef={innerRef}
        style={{ zIndex: 10 }}
      />
      {!isFocused && (
        <View style={{ marginLeft: 16 }}>
          <ButtonCircle size={50} onPress={goToQR}>
            <View style={styles.qrCircle}>
              <Octicons name="apps" size={24} color={color.midnight} />
            </View>
          </ButtonCircle>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
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
  leftButtonWrapper: {
    marginRight: 16,
    height: 50,
    justifyContent: "center",
  },
});
