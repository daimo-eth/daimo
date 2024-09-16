import React, { useState, useEffect } from "react";
import { View, Platform, Image } from "react-native";

import { styles } from "./shared";

function PenguinBackground({ children }: { children: React.ReactNode }) {
  const [useStaticImage, setUseStaticImage] = useState(false);

  useEffect(() => {
    setUseStaticImage(Platform.OS === "android");
  }, []);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Image
        source={
          useStaticImage
            ? require("../../../../assets/skins/penguin2.png")
            : require("../../../../assets/skins/penguin.gif")
        }
        style={{ width: "100%", height: "100%", opacity: 0.7 }}
      />
      <View style={styles.contentContainer}>{children}</View>
    </View>
  );
}

export default PenguinBackground;
