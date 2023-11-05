import Octicons from "@expo/vector-icons/Octicons";
import { useCallback } from "react";
import { StyleSheet, TouchableHighlight, View } from "react-native";

import { OctName } from "./InputBig";
import { OfflineHeader } from "./OfflineHeader";
import { useNav } from "./nav";
import { color, touchHighlightUnderlay } from "./style";
import { TextH3 } from "./text";

export function ScreenHeader({
  title,
  onBack,
  onExit,
  modal,
}: {
  title: string;
  onBack?: () => void;
  onExit?: () => void;
  modal?: boolean;
}) {
  const back = useCallback(onBack || (() => {}), [onBack]);
  const exit = useCallback(onExit || (() => {}), [onExit]);

  return (
    <>
      {!modal && <OfflineHeader />}
      <View style={styles.screenHead}>
        <ScreenHeadButton icon="arrow-left" show={!!onBack} onPress={back} />
        <TextH3>{title}</TextH3>
        <ScreenHeadButton icon="x" show={!!onExit} onPress={exit} />
      </View>
    </>
  );
}

export function useExitToHome() {
  const nav = useNav();
  return useCallback(
    () =>
      nav.reset({ routes: [{ name: "HomeTab", params: { screen: "Home" } }] }),
    []
  );
}

export function useExitBack() {
  const nav = useNav();
  const goBack = useCallback(() => nav.goBack(), []);
  return nav.canGoBack() ? goBack : undefined;
}

/** Shows a nav button if `show`, blank placeholder otherwise. */
function ScreenHeadButton({
  icon,
  show,
  onPress,
}: {
  icon: OctName;
  show: boolean;
  onPress: () => void;
}) {
  return (
    <View style={styles.screenHeadButtonWrap}>
      {show && (
        <TouchableHighlight
          onPress={onPress}
          style={styles.screenHeadButton}
          hitSlop={16}
          {...touchHighlightUnderlay.subtle}
        >
          <Octicons name={icon} size={30} color={color.midnight} />
        </TouchableHighlight>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenHead: {
    backgroundColor: color.white,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 40,
    paddingVertical: 16,
  },
  screenHeadButtonWrap: {
    width: 40,
  },
  screenHeadButton: {
    width: 40,
    height: 40,
    borderRadius: 40,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});
