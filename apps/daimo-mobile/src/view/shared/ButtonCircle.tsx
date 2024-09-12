import { ReactNode, useMemo } from "react";
import { TouchableHighlight } from "react-native";

import { touchHighlightUnderlay } from "../style/style";

export function ButtonCircle({
  onPress,
  size,
  margin,
  children,
}: {
  onPress: () => void;
  size: number;
  margin?: number;
  children: ReactNode;
}) {
  const style = useMemo(
    () => ({
      width: size,
      height: size,
      borderRadius: size,
      margin,
    }),
    [size]
  );

  return (
    <TouchableHighlight
      onPress={onPress}
      style={style}
      hitSlop={16}
      {...touchHighlightUnderlay.subtle}
    >
      {children}
    </TouchableHighlight>
  );
}
