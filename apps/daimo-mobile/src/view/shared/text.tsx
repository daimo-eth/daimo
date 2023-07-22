import { Text, TextProps } from "react-native";

import { ss } from "./style";

export function TextH1(props: TextProps) {
  return <Text {...props} style={ss.text.h1} />;
}

export function TextH2(props: TextProps) {
  return <Text {...props} style={ss.text.h2} />;
}

export function TextH3(props: TextProps) {
  return <Text {...props} style={ss.text.h3} />;
}

export function TextBody(props: TextProps) {
  return <Text {...props} style={ss.text.body} />;
}

export function TextLight(props: TextProps) {
  return <Text {...props} style={ss.text.small} />;
}

export function TextBold(props: TextProps) {
  return <Text {...props} style={ss.text.bold} />;
}

export function TextCenter(props: TextProps) {
  return <Text {...props} style={ss.text.center} />;
}

export function TextRight(props: TextProps) {
  return <Text {...props} style={ss.text.right} />;
}

export function TextError(props: TextProps) {
  return <Text {...props} style={ss.text.error} />;
}
