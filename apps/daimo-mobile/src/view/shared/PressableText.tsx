import { Pressable, PressableProps } from "react-native";

import { color } from "./style";
import { TextBody } from "./text";

type PressableTextProps = PressableProps & {
  text: string;
};

export function PressableText({ text, onPress, ...props }: PressableTextProps) {
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
