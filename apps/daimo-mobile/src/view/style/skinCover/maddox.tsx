import React from "react";
import { View, ImageBackground } from "react-native";

import { styles } from "./shared";

export function MaddoxBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require("../../../../assets/skins/maddox.png")}
        style={[styles.background, { opacity: 0.7 }]}
        resizeMode="cover"
      />
      <View style={styles.contentContainer}>{children}</View>
    </View>
  );
}
