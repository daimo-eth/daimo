import { useMemo } from "react";
import { View } from "react-native";

import { TextBtnCaps } from "./text";
import { useTheme } from "../style/theme";

export function Badge({
  children,
  color,
  bgColor,
}: {
  children: React.ReactNode;
  color?: string;
  bgColor?: string;
}) {
  const defaultColorway = useTheme().theme;

  color = color || defaultColorway.color.grayDark;
  bgColor = bgColor || defaultColorway.color.ivoryDark;

  const styleWrap = useMemo(
    () => ({
      backgroundColor: bgColor,
      borderRadius: 4,
      paddingVertical: 4,
      paddingHorizontal: 8,
    }),
    [bgColor]
  );

  return (
    <View style={styleWrap}>
      <TextBtnCaps color={color} numberOfLines={1}>
        {children}
      </TextBtnCaps>
    </View>
  );
}
