import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { Colorway } from "../style/skins";
import { useTheme } from "../style/theme";

export default function ScrollPellet() {
  const { color } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);
  return (
    <View style={styles.scrollPelletRow}>
      <View style={styles.scrollPellet} />
    </View>
  );
}

const getStyles = (color: Colorway) =>
  StyleSheet.create({
    scrollPelletRow: {
      flexDirection: "row",
      justifyContent: "center",
      paddingTop: 16,
      paddingBottom: 16,
    },
    scrollPellet: {
      backgroundColor: color.grayLight,
      width: 96,
      height: 4,
      borderRadius: 2,
    },
  });
