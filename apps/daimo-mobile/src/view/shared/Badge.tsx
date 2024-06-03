import { useMemo } from "react";
import { View } from "react-native";

import { color } from "./style";
import { TextBtnCaps } from "./text";

const defaultColor = color.grayDark;
const defaultBgColor = color.ivoryDark;

export function Badge({
  children,
  color,
  bgColor,
}: {
  children: React.ReactNode;
  color?: string;
  bgColor?: string;
}) {
  color = color || defaultColor;
  bgColor = bgColor || defaultBgColor;

  const styleWrap = useMemo(
    () => ({
      backgroundColor: bgColor,
      borderRadius: 4,
      paddingVertical: 4,
      paddingHorizontal: 8,
    }),
    [bgColor],
  );

  return (
    <View style={styleWrap}>
      <TextBtnCaps color={color} numberOfLines={1}>
        {children}
      </TextBtnCaps>
    </View>
  );
}
