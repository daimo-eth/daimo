import { ReactNode, useRef } from "react";
import { StyleSheet } from "react-native";

import { color, ss } from "./style";
import { DaimoText } from "./text";

export function IntroTextParagraph({ children }: { children: ReactNode }) {
  const style = useRef([styles.introText, { color: color.grayDark }]).current;
  return <DaimoText style={style}>{children}</DaimoText>;
}

const styles = StyleSheet.create({
  introText: {
    ...ss.text.body,
    lineHeight: 24,
  },
});
