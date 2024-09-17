import { Image } from "expo-image";
import React, { useMemo, useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";

import { SkinContextType, skins, SkinName, Colorway } from "./skins";
import { saveTheme, useTheme } from "./theme";

export function SkinSelector() {
  const { color, theme, setTheme } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);

  const [selectedSkin, setSelectedSkin] = useState<SkinName>(theme.name);

  const handleSkinSelection = async (skin: SkinContextType) => {
    setSelectedSkin(skin.name);
    setTheme(skin);
    await saveTheme(skin);
  };

  return (
    <View style={styles.skinSelector}>
      {Object.values(skins).map((skin: SkinContextType) => (
        <SkinBubble
          key={skin.name}
          skin={skin}
          isSelected={selectedSkin === skin.name}
          onSelect={() => handleSkinSelection(skin)}
        />
      ))}
    </View>
  );
}

function SkinBubble({
  skin,
  isSelected,
  onSelect,
}: {
  skin: SkinContextType;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { color } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);
  return (
    <TouchableOpacity onPress={onSelect}>
      <View style={[styles.logoBubble, isSelected && styles.selectedBubble]}>
        <Image source={skin.logo} style={styles.imageBubble} />
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (color: Colorway) => {
  return StyleSheet.create({
    logoBubble: {
      width: 36,
      height: 36,
      borderRadius: 99,
      borderWidth: 2,
      borderColor: "transparent",
    },
    selectedBubble: {
      borderColor: color.primary,
    },
    imageBubble: {
      width: 32,
      height: 32,
      borderRadius: 99,
      borderColor: color.grayLight,
      borderWidth: 1,
    },
    skinSelector: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      justifyContent: "center",
      paddingTop: 8,
      paddingBottom: 7,
    },
  });
};
