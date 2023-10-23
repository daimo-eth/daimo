import { useMemo } from "react";
import {
  StyleSheet,
  Text,
  TextStyle,
  TouchableHighlight,
  ViewStyle,
} from "react-native";

import { color, touchHighlightUnderlay } from "./style";

interface TextButtonProps {
  title?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}

interface ButtonProps extends TextButtonProps {
  type: "primary" | "success" | "danger" | "subtle";
}

export function ButtonBig(props: ButtonProps) {
  return (
    <Button
      {...props}
      style={useStyle(buttonStyles.big, props)}
      touchUnderlay={useTouchUnderlay(props.type)}
    />
  );
}

export function ButtonMed(props: ButtonProps) {
  return (
    <Button
      {...props}
      style={useStyle(buttonStyles.med, props)}
      touchUnderlay={useTouchUnderlay(props.type)}
    />
  );
}

export function TextButton(props: TextButtonProps) {
  return <Button {...props} style={useStyle(buttonStyles.small, props)} />;
}

function useStyle(base: ButtonStyle, props: TextButtonProps) {
  const { type } = props as ButtonProps;
  const btnOverride = useMemo<ViewStyle>(() => {
    switch (type) {
      case "primary":
        return { backgroundColor: color.primary };
      case "danger":
        return { backgroundColor: color.danger };
      case "success":
        return { backgroundColor: color.success };
      case "subtle": // Hollow, primary border on white background
        return {
          backgroundColor: color.white,
          borderWidth: 1,
          borderColor: color.primary,
        };
      default: // Text button. No fill, no border
        return {};
    }
  }, [type]);

  const titleOverride = useMemo<TextStyle>(() => {
    switch (type) {
      case "primary":
      case "danger":
      case "success":
        return { color: color.white };
      default:
        return { color: color.primary };
    }
  }, [type]);

  const style = useMemo(
    () => ({
      button: { ...base.button, ...btnOverride },
      title: { ...base.title, ...titleOverride },
    }),
    [base, btnOverride]
  );
  return style;
}

function useTouchUnderlay(type: ButtonProps["type"]) {
  return useMemo(() => {
    switch (type) {
      case "success":
        return touchHighlightUnderlay.success;
      case "danger":
        return touchHighlightUnderlay.danger;
      case "primary":
        return touchHighlightUnderlay.primary;
      case "subtle":
      default:
        return touchHighlightUnderlay.subtle;
    }
  }, [type]);
}

type ButtonStyle = { button: ViewStyle; title: TextStyle };

function Button(
  props: TextButtonProps & {
    style: ButtonStyle;
    touchUnderlay?: ReturnType<typeof useTouchUnderlay>;
  }
) {
  const disabledStyle = useMemo(
    () => ({ ...props.style.button, opacity: 0.5 }),
    [props.style.button]
  );

  const child = props.title ? (
    <Text style={props.style.title}>{props.title.toUpperCase()}</Text>
  ) : (
    props.children
  );

  return (
    <TouchableHighlight
      onPress={props.onPress}
      style={props.disabled ? disabledStyle : props.style.button}
      disabled={props.disabled}
      {...(props.touchUnderlay || touchHighlightUnderlay.subtle)}
    >
      {child}
    </TouchableHighlight>
  );
}

const buttonStyles = {
  big: StyleSheet.create({
    button: {
      paddingHorizontal: 24,
      paddingVertical: 20,
      borderRadius: 8,
      backgroundColor: color.primaryBgLight,
    },
    title: {
      fontSize: 14,
      fontWeight: "bold",
      letterSpacing: 1,
      textAlign: "center",
    },
  }),
  med: StyleSheet.create({
    button: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 6,
      backgroundColor: color.primaryBgLight,
    },
    title: {
      fontSize: 14,
      fontWeight: "bold",
      letterSpacing: 1,
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
      fontSize: 14,
      fontWeight: "bold",
      letterSpacing: 1,
      textAlign: "center",
    },
  }),
};
