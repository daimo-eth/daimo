import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { Colorway } from "../../style/skins";
import { useTheme } from "../../style/theme";

export function NotificationRow({ children }: { children: React.ReactNode }) {
  const { color } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);

  return <View style={styles.row}>{children}</View>;
}

const getStyles = (color: Colorway) =>
  StyleSheet.create({
    row: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderTopWidth: 1,
      borderColor: color.grayLight,
      marginHorizontal: 16,
      paddingVertical: 16,
    },
  });
