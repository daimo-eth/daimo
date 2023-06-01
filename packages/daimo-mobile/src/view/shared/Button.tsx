import {
  StyleSheet,
  TouchableHighlight,
  Text,
  ViewStyle,
  StyleProp,
  TextStyle,
} from "react-native";
import { color, touchHighlightUnderlay } from "./style";

interface ButtonProps {
  title: string;
  onPress?: () => void;
}

export function ButtonBig(props: ButtonProps) {
  return <Button {...props} style={buttonStyles.big} />;
}

export function ButtonSmall(props: ButtonProps) {
  return <Button {...props} style={buttonStyles.small} />;
}

export function Button(
  props: ButtonProps & {
    style: { button: StyleProp<ViewStyle>; title: StyleProp<TextStyle> };
  }
) {
  return (
    <TouchableHighlight
      onPress={props.onPress}
      style={props.style.button}
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
    },
  }),
  smallFill: StyleSheet.create({
    button: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: color.bg.lightGray,
    },
    title: {
      fontSize: 16,
      fontWeight: "600",
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
    },
  }),
};
