import { StyleSheet, View } from "react-native";

import { color } from "./style";
import { TextBody } from "./text";

export function InfoBubble({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.bubble}>
      <View style={styles.bubbleIcon}>
        <TextBody color={color.white}>i</TextBody>
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
    padding: 16,
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
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
