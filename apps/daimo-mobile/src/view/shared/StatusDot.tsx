import { StyleSheet, View } from "react-native";

import { Colorway } from "../style/skins";
import { useTheme } from "../style/theme";

export function PendingDot({ size }: { size?: number }) {
  const { color } = useTheme();
  return <View style={styles(size || 12, color).pendingDot} />;
}

export function ProcessingDot({ size }: { size?: number }) {
  const { color } = useTheme();
  return <View style={styles(size || 12, color).processingDot} />;
}

export function FailedDot({ size }: { size?: number }) {
  const { color } = useTheme();
  return <View style={styles(size || 12, color).failedDot} />;
}

const styles = (size: number, color: Colorway) =>
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
    failedDot: {
      width: size,
      height: size,
      borderRadius: size,
      backgroundColor: color.danger,
    },
  });
