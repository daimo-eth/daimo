import { assert } from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import { ReactNode, useCallback, useMemo } from "react";
import { StyleSheet, TouchableHighlight, View } from "react-native";

import { OctName } from "./InputBig";
import { OfflineHeader } from "./OfflineHeader";
import { TextH3 } from "./text";
import { Colorway } from "../style/skins";
import { useTheme } from "../style/theme";

export function ScreenHeader({
  title,
  onBack,
  onExit,
  onShare,
  hideOfflineHeader,
  secondaryHeader,
}: {
  title: ReactNode;
  onBack?: () => void;
  onExit?: () => void;
  onShare?: () => void;
  hideOfflineHeader?: boolean;
  secondaryHeader?: ReactNode;
}) {
  assert(!onExit || !onShare, "Exit and share are mutually exclusive");
  const { color } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);

  const back = useCallback(onBack || (() => {}), [onBack]);
  const exit = useCallback(onExit || (() => {}), [onExit]);
  const share = useCallback(onShare || (() => {}), [onShare]);

  return (
    <>
      {!hideOfflineHeader && <OfflineHeader />}
      {secondaryHeader}
      <View style={styles.screenHead}>
        <ScreenHeadButton icon="arrow-left" show={!!onBack} onPress={back} />
        <TextH3>{title}</TextH3>
        {onExit ? (
          <ScreenHeadButton icon="x" show={!!onExit} onPress={exit} />
        ) : (
          <ScreenHeadButton icon="share" show={!!onShare} onPress={share} />
        )}
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
  const { color, touchHighlightUnderlay } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);

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

const getStyles = (color: Colorway) =>
  StyleSheet.create({
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
