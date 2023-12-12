import { EAccount } from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import { RefObject, useCallback } from "react";
import { StyleSheet, TextInput, View } from "react-native";

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
      <ButtonCircle size={50} margin={16} onPress={goToAccount}>
        <AccountBubble eAcc={eAcc} size={50} fontSize={20} transparent />
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
      <ButtonCircle size={50} margin={16} onPress={goToQR}>
        <View style={styles.qrCircle}>
          <Octicons name="apps" size={24} color={color.midnight} />
        </View>
      </ButtonCircle>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
