import Octicons from "@expo/vector-icons/Octicons";
import { ReactNode, useMemo } from "react";
import { Text, TextProps } from "react-native";

import { useTheme } from "../style/theme";

export const MAX_FONT_SIZE_MULTIPLIER = 1.4;

type TypographyProps = TextProps & {
  variant?:
    | "h1"
    | "h2"
    | "h3"
    | "body"
    | "bodyCaps"
    | "bodyMedium"
    | "metadata"
    | "metadataLight"
    | "para"
    | "btnCaps"
    | "error"
    | "center"
    | "emphasizedSmallText"
    | "dropdown";
  color?: string;
};

// Temporary component for text management pending a full refactor
export function DaimoText({
  variant = "body",
  color,
  style,
  ...props
}: TypographyProps) {
  const { ss, color: themeColor } = useTheme();
  return (
    <Text
      style={[ss.text[variant], { color: color || themeColor.midnight }, style]}
      maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
      {...props}
    />
  );
}

export function TextH1(props: TypographyProps) {
  return <DaimoText variant="h1" {...props} />;
}

export function TextH2(props: TypographyProps) {
  return <DaimoText variant="h2" {...props} />;
}

export function TextH3(props: TypographyProps) {
  return <DaimoText variant="h3" {...props} />;
}

export function TextBody(props: TypographyProps) {
  return <DaimoText variant="body" {...props} />;
}

export function TextBodyCaps(props: TypographyProps) {
  return <DaimoText variant="bodyCaps" {...props} />;
}

export function TextBodyMedium(props: TypographyProps) {
  return <DaimoText variant="bodyMedium" {...props} />;
}

export function TextMeta(props: TypographyProps) {
  return <DaimoText variant="metadata" {...props} />;
}

export function TextPara(props: TypographyProps) {
  return <DaimoText variant="para" {...props} />;
}

export function TextBtnCaps(props: TypographyProps) {
  return <DaimoText variant="btnCaps" {...props} />;
}

export function TextLight(props: TextProps) {
  const { color } = useTheme();
  return <TextBody {...props} color={color.gray3} />;
}

export function TextColor(props: TextProps & { color: string }) {
  const style = useMemo(() => [{ color: props.color }], [props.color]);
  return <DaimoText {...props} style={style} />;
}

export function TextBold(props: TextProps) {
  const { ss } = useTheme();
  return <DaimoText {...props} style={ss.text.bold} />;
}

export function TextLink(props: TextProps) {
  const { ss } = useTheme();
  return <DaimoText {...props} style={ss.text.link} />;
}

export function TextCenter(props: TextProps) {
  const { ss } = useTheme();
  return <DaimoText {...props} style={ss.text.center} />;
}

export function TextError(props: TextProps) {
  const { ss } = useTheme();
  return <DaimoText {...props} style={ss.text.error} />;
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
    parts.push(
      <Text key={last} allowFontScaling={false}>
        {joiningPart}
      </Text>
    );
    const octiconName = emojiToOcticon[match[0]];
    parts.push(<Octicons key={last + 1} size={size} name={octiconName} />);
  }
  parts.push(
    <Text key={last} allowFontScaling={false}>
      {text.substring(last)}
    </Text>
  );

  return <>{parts}</>;
}
