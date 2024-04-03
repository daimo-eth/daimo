import { StyleSheet, View } from "react-native";

import { color } from "../../shared/style";

export function NotificationRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
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
