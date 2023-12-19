import { EAccount } from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import { RefObject, useCallback } from "react";
import { Keyboard, StyleSheet, TextInput, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { AccountBubble } from "./AccountBubble";
import { ButtonCircle } from "./ButtonCircle";
import { InputBig } from "./InputBig";
import { useNav } from "./nav";
import { color } from "./style";
import { useAccount } from "../../model/account";

const fadeIn = FadeIn.duration(150);
const fadeOut = FadeOut.duration(150);

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
      <Animated.View
        style={{
          marginRight: 16,
          height: 50,
          justifyContent: "center",
        }}
        entering={fadeIn}
        exiting={fadeOut}
      >
        {isFocused ? (
          <Animated.View entering={fadeIn} exiting={fadeOut} key="back">
            <TouchableOpacity onPress={() => Keyboard.dismiss()} hitSlop={16}>
              <Octicons name="arrow-left" size={30} color={color.midnight} />
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View entering={fadeIn} exiting={fadeOut} key="icon">
            <ButtonCircle size={50} onPress={goToAccount}>
              <AccountBubble eAcc={eAcc} size={50} transparent />
            </ButtonCircle>
          </Animated.View>
        )}
      </Animated.View>
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
        <Animated.View
          style={{ marginLeft: 16 }}
          entering={FadeIn}
          exiting={FadeOut}
        >
          <ButtonCircle size={50} onPress={goToQR}>
            <View style={styles.qrCircle}>
              <Octicons name="apps" size={24} color={color.midnight} />
            </View>
          </ButtonCircle>
        </Animated.View>
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
});
