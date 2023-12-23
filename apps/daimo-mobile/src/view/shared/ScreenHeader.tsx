import Octicons from "@expo/vector-icons/Octicons";
import { ReactNode, useCallback } from "react";
import { StyleSheet, TouchableHighlight, View } from "react-native";

import { OctName } from "./InputBig";
import { OfflineHeader } from "./OfflineHeader";
import { color, touchHighlightUnderlay } from "./style";
import { TextH3 } from "./text";

export function ScreenHeader({
  title,
  onBack,
  onExit,
}: {
  title: ReactNode;
  onBack?: () => void;
  onExit?: () => void;
}) {
  const back = useCallback(onBack || (() => {}), [onBack]);
  const exit = useCallback(onExit || (() => {}), [onExit]);

  return (
    <>
      <OfflineHeader />
      <View style={styles.screenHead}>
        <ScreenHeadButton icon="arrow-left" show={!!onBack} onPress={back} />
        <TextH3>{title}</TextH3>
        <ScreenHeadButton icon="x" show={!!onExit} onPress={exit} />
      </View>
    </>
  );
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
    height: 48,
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
