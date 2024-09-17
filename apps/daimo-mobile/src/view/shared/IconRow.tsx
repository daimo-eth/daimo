import { Octicons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";

import { OctName } from "./InputBig";
import { TextBody } from "./text";
import { useTheme } from "../style/theme";

export function IconRow(props: {
  icon?: OctName;
  color?: string;
  title: string;
}) {
  const { color } = useTheme();
  const { icon, title } = props;
  const col = props.color || color.grayMid;
  return (
    <View style={styles.iconRow}>
      {icon && <Octicons name={icon} size={20} color={col} />}
      <TextBody color={col}>{title}</TextBody>
    </View>
  );
}

const styles = StyleSheet.create({
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 40,
  },
});
