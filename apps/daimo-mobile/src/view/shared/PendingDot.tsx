import { StyleSheet, View } from "react-native";

import { color } from "./style";

export function PendingDot({ size }: { size?: number }) {
  return <View style={styles(size || 12).pendingDot} />;
}

export function ProcessingDot({ size }: { size?: number }) {
  return <View style={styles(size || 12).processingDot} />;
}

const styles = (size: number) =>
  StyleSheet.create({
    pendingDot: {
      width: size,
      height: size,
      borderRadius: size,
      backgroundColor: color.yellow,
    },
    processingDot: {
      width: size,
      height: size,
      borderRadius: size,
      backgroundColor: color.lightBlue,
    },
  });
