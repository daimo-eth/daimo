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
    paddingVertical: 16,
  },
  scrollPellet: {
    backgroundColor: color.bg.midGray,
    width: 96,
    height: 4,
    borderRadius: 2,
  },
});
