import Octicons from "@expo/vector-icons/Octicons";
import { RefObject, useCallback, useEffect, useMemo } from "react";
import { Keyboard, StyleSheet, TextInput, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { AnimatedSearchInput } from "./AnimatedSearchInput";
import { ButtonCircle } from "./ButtonCircle";
import { Icon } from "./Icon";
import { useNav } from "../../common/nav";
import { i18n } from "../../i18n";
import { useAccount } from "../../logic/accountManager";
import { useInAppNotifications } from "../../logic/inAppNotifications";
import { Colorway } from "../style/skins";
import { useTheme } from "../style/theme";

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
  const { color } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);

  const isFocused = useSharedValue(prefix != null);
  const nav = useNav();

  useEffect(() => {
    isFocused.value = prefix != null;
  }, [prefix]);

  const qrButton = useAnimatedStyle(() => {
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

  const notificationsButton = useAnimatedStyle(() => {
    return {
      position: "absolute",
      opacity: isFocused.value
        ? withTiming(0, animationConfig)
        : withTiming(1, animationConfig),
      zIndex: isFocused.value ? 0 : 10,
      elevation: isFocused.value ? 0 : 10,
      right: 0,
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

  // Left: QR code
  const goToQR = useCallback(
    () =>
      nav.navigate("HomeTab", { screen: "QR", params: { option: undefined } }),
    [nav]
  );

  // Right: Notifications
  const goToNotifications = useCallback(
    () => nav.navigate("HomeTab", { screen: "Notifications" }),
    []
  );

  const account = useAccount();
  const notifInfo = useInAppNotifications();

  if (account == null) return null;

  return (
    <View style={styles.header}>
      <Animated.View key="back" style={backButton}>
        <TouchableOpacity
          onPress={() => {
            setPrefix(undefined);
            Keyboard.dismiss();
          }}
          hitSlop={16}
        >
          <Octicons name="arrow-left" size={30} color={color.midnight} />
        </TouchableOpacity>
      </Animated.View>
      <Animated.View key="icon" style={qrButton}>
        <ButtonCircle size={50} onPress={goToQR}>
          <View style={styles.circleButton}>
            <Icon name="qr-code-01" size={24} color={color.primary} />
          </View>
        </ButtonCircle>
      </Animated.View>
      <AnimatedSearchInput
        icon="search"
        placeholder={i18n.searchHeader.searchUser()}
        value={prefix}
        onChange={setPrefix}
        onFocus={() => setPrefix(prefix || "")}
        onClose={() => setPrefix(undefined)}
        innerRef={innerRef}
        style={{ zIndex: 10 }}
      />
      <Animated.View style={[{ marginLeft: 16 }, notificationsButton]}>
        <ButtonCircle size={50} onPress={goToNotifications}>
          <View style={styles.circleButton}>
            <Icon name="bell-01" size={24} color={color.primary} />
            {notifInfo.unread && <NotificationBadge />}
          </View>
        </ButtonCircle>
      </Animated.View>
    </View>
  );
}

function NotificationBadge() {
  const { color } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);

  return (
    <View style={styles.badgeBorder}>
      <View style={styles.badge} />
    </View>
  );
}

const getStyles = (color: Colorway) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginHorizontal: 16,
    },
    circleButton: {
      width: 50,
      height: 50,
      borderRadius: 50,
      borderWidth: 1,
      borderColor: color.grayLight,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
    badge: {
      backgroundColor: "red",
      borderRadius: 4,
      height: 6,
      width: 6,
    },
    badgeBorder: {
      backgroundColor: "white",
      height: 10,
      width: 10,
      borderRadius: 5,
      position: "absolute",
      top: 10,
      right: 14,
      justifyContent: "center",
      alignItems: "center",
    },
  });
