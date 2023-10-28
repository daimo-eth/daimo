import Octicons from "@expo/vector-icons/Octicons";
import { ReactNode, useMemo } from "react";
import { Text, TextProps, TextStyle } from "react-native";

import { color, ss } from "./style";

function useStyle(baseStyle: TextStyle, { color }: { color?: string }) {
  return useMemo(() => [baseStyle, { color }], [baseStyle, color]);
}

export function TextH1(props: TextProps & { color?: string }) {
  return <Text {...props} style={useStyle(ss.text.h1, props)} />;
}

export function TextH2(props: TextProps & { color?: string }) {
  return <Text {...props} style={useStyle(ss.text.h2, props)} />;
}

export function TextH3(props: TextProps & { color?: string }) {
  return <Text {...props} style={useStyle(ss.text.h3, props)} />;
}

export function TextBody(props: TextProps & { color?: string }) {
  return <Text {...props} style={useStyle(ss.text.body, props)} />;
}

export function TextMeta(props: TextProps & { color?: string }) {
  return <Text {...props} style={useStyle(ss.text.metadata, props)} />;
}

export function TextPara(props: TextProps) {
  return <Text {...props} style={ss.text.para} />;
}

export function TextLight(props: TextProps) {
  return <TextBody {...props} color={color.gray3} />;
}

export function TextBold(props: TextProps) {
  return <Text {...props} style={ss.text.bold} />;
}

export function TextCenter(props: TextProps) {
  return <Text {...props} style={ss.text.center} />;
}

export function TextError(props: TextProps) {
  return <Text {...props} style={ss.text.error} />;
}

type OcticonName = React.ComponentProps<typeof Octicons>["name"];

const emojiToOcticon: Record<string, OcticonName> = {
  "🔒": "lock",
};

export function EmojiToOcticon({ text, size }: { text: string; size: number }) {
  // Split by emoji
  const regex = new RegExp(Object.keys(emojiToOcticon).join("|"), "g");

  // Replace certain emojis with octicons
  const parts: ReactNode[] = [];
  let match, last;
  for (last = 0; (match = regex.exec(text)) != null; last = regex.lastIndex) {
    const joiningPart = text.substring(last, match.index);
    parts.push(<Text key={last}>{joiningPart}</Text>);
    const octiconName = emojiToOcticon[match[0]];
    parts.push(<Octicons key={last + 1} size={size} name={octiconName} />);
  }
  parts.push(<Text key={last}>{text.substring(last)}</Text>);

  return <>{parts}</>;
}
