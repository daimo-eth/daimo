import { useMemo } from "react";
import {
  StyleSheet,
  Text,
  TextStyle,
  TouchableHighlight,
  ViewStyle,
} from "react-native";
import { color, touchHighlightUnderlay } from "./style";

interface ButtonProps {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
}

export function ButtonBig(props: ButtonProps) {
  return <Button {...props} style={buttonStyles.big} />;
}

export function ButtonSmall(props: ButtonProps) {
  return <Button {...props} style={buttonStyles.small} />;
}

export function Button(
  props: ButtonProps & {
    style: { button: ViewStyle; title: TextStyle };
  }
) {
  const disabledStyle = useMemo(
    () => ({ ...props.style.button, opacity: 0.5 }),
    [props.style.button]
  );

  return (
    <TouchableHighlight
      onPress={props.onPress}
      style={props.disabled ? disabledStyle : props.style.button}
      disabled={props.disabled}
      {...touchHighlightUnderlay}
    >
      <Text style={props.style.title}>{props.title}</Text>
    </TouchableHighlight>
  );
}

export const buttonStyles = {
  big: StyleSheet.create({
    button: {
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderRadius: 8,
      backgroundColor: color.bg.lightGray,
    },
    title: {
      fontSize: 20,
      fontWeight: "600",
      textAlign: "center",
    },
  }),
  med: StyleSheet.create({
    button: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderRadius: 8,
      backgroundColor: color.bg.lightGray,
    },
    title: {
      fontSize: 16,
      fontWeight: "600",
      textAlign: "center",
    },
  }),
  small: StyleSheet.create({
    button: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    title: {
      fontSize: 16,
      fontWeight: "600",
      textAlign: "center",
    },
  }),
};
