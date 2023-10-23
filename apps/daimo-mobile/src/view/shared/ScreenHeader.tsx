import Octicons from "@expo/vector-icons/Octicons";
import { useCallback, useMemo } from "react";
import { StyleSheet, TouchableHighlight, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { OctName } from "./InputBig";
import { useNav } from "./nav";
import { color, touchHighlightUnderlay } from "./style";
import { TextH3 } from "./text";

export function ScreenHeader({
  title,
  onBack,
}: {
  title: string;
  onBack?: () => void;
}) {
  const ins = useSafeAreaInsets();
  const style = useMemo(
    () => [styles.screenHead, { paddingTop: ins.top, height: 40 + ins.top }],
    [ins]
  );

  const nav = useNav();
  const back = useCallback(onBack || (() => {}), [onBack]);
  const exit = useCallback(
    () => nav.reset({ routes: [{ name: "HomeTab" }] }),
    []
  );

  return (
    <View style={style}>
      <ScreenHeadButton icon="arrow-left" show={!!onBack} onPress={back} />
      <TextH3>{title}</TextH3>
      <ScreenHeadButton icon="x" show onPress={exit} />
    </View>
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
