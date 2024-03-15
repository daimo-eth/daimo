import Octicons from "@expo/vector-icons/Octicons";
import { RefObject, useCallback, useEffect, useRef } from "react";
import { Keyboard, StyleSheet, TextInput, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import {
  AnimatedSearchInput,
  AnimatedSearchInputRef,
} from "./AnimatedSearchInput";
import { ButtonCircle } from "./ButtonCircle";
import { ContactBubble } from "./ContactBubble";
import { color } from "./style";
import { useNav } from "../../common/nav";
import { useAccount } from "../../logic/accountManager";
import { toEAccountContact } from "../../model/account";

const animationConfig = { duration: 150 };

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
  const isFocused = useSharedValue(prefix != null);
  const nav = useNav();
  const ref = useRef<AnimatedSearchInputRef>(null);

  useEffect(() => {
    isFocused.value = prefix != null;
  }, [prefix]);

  const qrButton = useAnimatedStyle(() => {
    return {
      position: "absolute",
      opacity: isFocused.value ? withTiming(0) : withTiming(1),
      zIndex: isFocused.value ? 0 : 10,
      elevation: isFocused.value ? 0 : 10,
      right: 0,
    };
  });

  const accountButton = useAnimatedStyle(() => {
    return {
      position: "absolute",
      opacity: isFocused.value
        ? withTiming(0, animationConfig)
        : withTiming(1, animationConfig),
      zIndex: isFocused.value ? 0 : 10,
      elevation: isFocused.value ? 0 : 10,
      left: 0,
    };
  });

  const backButton = useAnimatedStyle(() => {
    return {
      position: "absolute",
      opacity: isFocused.value
        ? withTiming(1, animationConfig)
        : withTiming(0, animationConfig),
      zIndex: isFocused.value ? 12 : 0,
      elevation: isFocused.value ? 12 : 0,
      left: 0,
    };
  });

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
  const eAcc = toEAccountContact(account);

  return (
    <View style={styles.header}>
      <Animated.View key="back" style={backButton}>
        <TouchableOpacity
          onPress={() => {
            setPrefix(undefined);
            Keyboard.dismiss();
            ref.current?.closeInput();
          }}
          hitSlop={16}
        >
          <Octicons name="arrow-left" size={30} color={color.midnight} />
        </TouchableOpacity>
      </Animated.View>
      <Animated.View key="icon" style={accountButton}>
        <ButtonCircle size={50} onPress={goToAccount}>
          <ContactBubble contact={eAcc} size={50} transparent />
        </ButtonCircle>
      </Animated.View>
      <AnimatedSearchInput
        ref={ref}
        icon="search"
        placeholder="Search for user..."
        value={prefix || ""}
        onChange={setPrefix}
        onFocus={() => setPrefix(prefix || "")}
        onClose={() => setPrefix(undefined)}
        innerRef={innerRef}
        style={{ zIndex: 10 }}
      />
      <Animated.View style={[{ marginLeft: 16 }, qrButton]}>
        <ButtonCircle size={50} onPress={goToQR}>
          <View style={styles.qrCircle}>
            <Octicons name="apps" size={24} color={color.midnight} />
          </View>
        </ButtonCircle>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "center",
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
