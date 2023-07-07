import { useMemo } from "react";
import {
  StyleSheet,
  Text,
  TextStyle,
  TouchableHighlight,
  ViewStyle,
} from "react-native";

import { color, ss, touchHighlightUnderlay } from "./style";

interface ButtonProps {
  title?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  type?: "primary" | "default" | "danger";
}

export function ButtonBig(props: ButtonProps) {
  return <Button {...props} style={useStyle(buttonStyles.big, props)} />;
}

export function ButtonMed(props: ButtonProps) {
  return <Button {...props} style={useStyle(buttonStyles.med, props)} />;
}

export function ButtonSmall(props: ButtonProps) {
  return <Button {...props} style={useStyle(buttonStyles.small, props)} />;
}

function useStyle(base: ButtonStyle, props: ButtonProps) {
  const btnOverride = useMemo<ViewStyle>(() => {
    switch (props.type) {
      case "primary":
        return { backgroundColor: color.primary };
      case "danger":
        return { backgroundColor: color.danger };
      default:
        return {};
    }
  }, [props.type]);

  const titleOverride = useMemo<TextStyle>(() => {
    switch (props.type) {
      case "primary":
      case "danger":
        return { color: color.white };
      default:
        return {};
    }
  }, [props.type]);

  const style = useMemo(
    () => ({
      button: { ...base.button, ...btnOverride },
      title: { ...base.title, ...titleOverride },
    }),
    [base, btnOverride, titleOverride]
  );
  return style;
}

type ButtonStyle = { button: ViewStyle; title: TextStyle };

export function Button(
  props: ButtonProps & {
    style: ButtonStyle;
  }
) {
  const disabledStyle = useMemo(
    () => ({ ...props.style.button, opacity: 0.5 }),
    [props.style.button]
  );

  const child = props.title ? (
    <Text style={props.style.title}>{props.title}</Text>
  ) : (
    props.children
  );

  return (
    <TouchableHighlight
      onPress={props.onPress}
      style={props.disabled ? disabledStyle : props.style.button}
      disabled={props.disabled}
      {...touchHighlightUnderlay}
    >
      {child}
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
      paddingVertical: 12,
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
      color: color.darkGray,
    },
  }),
};
