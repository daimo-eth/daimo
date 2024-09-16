import React from "react";
import { View } from "react-native";

import DogeBackground from "./doge";
import { MaddoxBackground } from "./maddox";
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
    case Skin.maddox:
      return <MaddoxBackground>{children}</MaddoxBackground>;
    case Skin.doge:
      return (
        <View style={styles.background}>
          <DogeBackground />
          <View style={styles.contentContainer}>{children}</View>
        </View>
      );
    case Skin.penguin:
      return <PenguinBackground>{children}</PenguinBackground>;
    default:
      return <View style={styles.contentContainer}>{children}</View>;
  }
}
