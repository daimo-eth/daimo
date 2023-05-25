import {
  StyleSheet,
  TouchableHighlight,
  Text,
  ViewStyle,
  StyleProp,
  TextStyle,
} from "react-native";
import { color } from "./style";

interface ButtonProps {
  title: string;
  onPress?: () => void;
}

export function ButtonBig(props: ButtonProps) {
  return <Button {...props} style={styles.big} />;
}

export function ButtonSmall(props: ButtonProps) {
  return <Button {...props} style={styles.small} />;
}

function Button(
  props: ButtonProps & {
    style: { button: StyleProp<ViewStyle>; title: StyleProp<TextStyle> };
  }
) {
  return (
    <TouchableHighlight
      onPress={props.onPress}
      style={props.style.button}
      underlayColor={color.bg.blue}
      activeOpacity={0.5}
    >
      <Text style={props.style.title}>{props.title}</Text>
    </TouchableHighlight>
  );
}

const styles = {
  big: StyleSheet.create({
    button: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: color.bg.lightGray,
    },
    title: {
      fontSize: 20,
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
