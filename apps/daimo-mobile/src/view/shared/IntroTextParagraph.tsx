import { ReactNode, useRef } from "react";
import { StyleSheet, Text } from "react-native";

import { color, ss } from "./style";
import { MAX_FONT_SIZE_MULTIPLIER } from "./text";

export function IntroTextParagraph({ children }: { children: ReactNode }) {
  const style = useRef([styles.introText, { color: color.grayDark }]).current;
  return (
    <Text style={style} maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  introText: {
    ...ss.text.body,
    lineHeight: 24,
  },
});
