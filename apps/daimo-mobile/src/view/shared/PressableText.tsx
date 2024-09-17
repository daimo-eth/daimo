import { Pressable, PressableProps } from "react-native";

import { TextBody } from "./text";
import { useTheme } from "../style/theme";

type PressableTextProps = PressableProps & {
  text: string;
};

export function PressableText({ text, onPress, ...props }: PressableTextProps) {
  const { color } = useTheme();
  return (
    <Pressable
      style={{ marginLeft: 16 }}
      onPress={onPress}
      hitSlop={8}
      {...props}
    >
      {({ pressed }) => (
        <TextBody color={pressed ? color.gray3 : color.grayMid}>
          {text}
        </TextBody>
      )}
    </Pressable>
  );
}
