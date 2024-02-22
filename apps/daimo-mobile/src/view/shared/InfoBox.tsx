import Octicons from "@expo/vector-icons/Octicons";
import { StyleSheet, View } from "react-native";

import { OctName } from "./InputBig";
import { color } from "./style";
import { TextBody } from "./text";

export function InfoBox({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon?: OctName;
}) {
  return (
    <View style={styles.bubble}>
      <View style={styles.bubbleIcon}>
        {!icon && <TextBody color={color.white}>i</TextBody>}
        {icon && <Octicons name={icon} size={16} color={color.white} />}
      </View>
      <View style={styles.bubbleText}>
        <TextBody>{title}</TextBody>
        <TextBody color={color.grayDark}>{subtitle}</TextBody>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    width: 32,
    height: 32,
    borderRadius: 32,
  },
  bubbleText: {
    flex: 1,
    flexDirection: "column",
  },
});
