import React from "react";
import { View } from "react-native";

import DogeBackground from "./doge";
import { DuckBackground } from "./duck";
import PenguinBackground from "./penguin";
import { styles } from "./shared";
import { Skin } from "../skins";
import { useTheme } from "../theme";

/**
 * Wraps the home screen components with the skin background.
 */

export function ThemeBackground({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  switch (theme.name) {
    case Skin.doge:
      return (
        <View style={styles.background}>
          <DogeBackground />
          <View style={styles.contentContainer}>{children}</View>
        </View>
      );
    case Skin.penguin:
      return <PenguinBackground>{children}</PenguinBackground>;
    case Skin.duck:
      return (
        <View style={styles.background}>
          <DuckBackground />
          <View style={styles.contentContainer}>{children}</View>
        </View>
      );
    default:
      return <View style={styles.contentContainer}>{children}</View>;
  }
}
