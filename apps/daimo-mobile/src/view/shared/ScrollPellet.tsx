import { StyleSheet, View } from "react-native";

import { color } from "../style/style";

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
