import Octicons from "@expo/vector-icons/Octicons";
import { ReactNode, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { OctName } from "./InputBig";
import { TextBody } from "./text";
import { Colorway } from "../style/skins";
import { useTheme } from "../style/theme";

export function InfoBox({
  title,
  subtitle,
  icon,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: OctName;
}) {
  const { color } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);

  if (typeof title === "string") {
    title = <TextBody>{title}</TextBody>;
  }

  return (
    <View style={styles.bubble}>
      <View style={styles.bubbleIcon}>
        {!icon && <TextBody color={color.white}>i</TextBody>}
        {icon && <Octicons name={icon} size={16} color={color.white} />}
      </View>
      <View style={styles.bubbleText}>
        {title}
        {subtitle && <TextBody color={color.grayDark}>{subtitle}</TextBody>}
      </View>
    </View>
  );
}

const getStyles = (color: Colorway) =>
  StyleSheet.create({
    bubble: {
      backgroundColor: color.ivoryDark,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 16,
      marginHorizontal: 8,
    },
    bubbleIcon: {
      backgroundColor: color.primary,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      width: 24,
      height: 24,
      borderRadius: 24,
    },
    bubbleText: {
      flex: 1,
      flexDirection: "column",
    },
  });
