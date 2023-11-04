import { StyleSheet, View } from "react-native";

import { color } from "../shared/style";

export default function ScrollPellet() {
  return (
    <View style={styles.scrollPelletRow}>
      <View style={styles.scrollPellet} />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollPelletRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingTop: 24,
    paddingBottom: 8,
  },
  scrollPellet: {
    backgroundColor: color.grayLight,
    width: 96,
    height: 4,
    borderRadius: 2,
  },
});
