import { ReactNode } from "react";
import { StyleSheet, TouchableHighlight } from "react-native";

import { touchHighlightUnderlay } from "./style";

export function ButtonCircle({
  onPress,
  children,
}: {
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <TouchableHighlight
      onPress={onPress}
      style={styles.buttonCircle}
      hitSlop={12}
      {...touchHighlightUnderlay.subtle}
    >
      {children}
    </TouchableHighlight>
  );
}
const styles = StyleSheet.create({
  buttonCircle: {
    width: 50,
    height: 50,
    borderRadius: 50,
    margin: 16,
  },
});
