import { Platform, StyleSheet, TextStyle } from "react-native";

export const color = {
  primary: "#007aff",
  primaryLight: "#aaccff",
  danger: "#f35369",
  success: "#4cd964",
  successDark: "#090",
  black: "#000",
  grayDark: "#222",
  gray: "#668",
  grayLight: "#eef0f4",
  white: "#fff",
};

const textBase: TextStyle = {
  fontVariant: ["tabular-nums"],
  color: color.black,
};

const activeAlpha = "aa";

export const touchHighlightUnderlay = {
  primary: {
    underlayColor: color.primary + activeAlpha,
  },
  danger: {
    underlayColor: color.danger + activeAlpha,
  },
  success: {
    underlayColor: color.success + activeAlpha,
  },
  subtle: {
    underlayColor: color.primaryLight + activeAlpha,
  },
};

const styleFullWidth = {
  flex: 1,
  flexDirection: "column",
  padding: 16,
  backgroundColor: color.white,
  alignItems: "stretch",
} as const;

export const ss = {
  container: StyleSheet.create({
    fullWidthSinglePage: {
      ...styleFullWidth,
      paddingBottom: 48,
    },
    fullWidthScroll: {
      ...styleFullWidth,
      paddingBottom: 0,
      paddingTop: 48,
    },
    fullWidthModal: {
      ...styleFullWidth,
      alignSelf: "stretch",
      flexGrow: 1,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    padH16: {
      paddingHorizontal: 16,
    },
    marginHNeg16: {
      marginHorizontal: -16,
    },
    debug: {
      borderWidth: 1,
      borderColor: "#f00",
    },
  }),
  text: StyleSheet.create({
    h1: {
      ...textBase,
      fontSize: 36,
      fontWeight: "bold",
      textAlign: "center",
      lineHeight: 48,
    },
    h2: {
      ...textBase,
      fontSize: 24,
      fontWeight: "bold",
      lineHeight: 32,
    },
    h3: {
      ...textBase,
      fontSize: 18,
      fontWeight: "bold",
      lineHeight: 24,
    },
    body: {
      ...textBase,
      fontSize: 16,
      lineHeight: 24,
    },
    small: {
      ...textBase,
      fontSize: 16,
      lineHeight: 20,
      color: color.gray,
    },
    error: {
      ...textBase,
      fontSize: 16,
      lineHeight: 20,
      color: color.danger,
    },
    center: {
      textAlign: "center",
    },
    right: {
      textAlign: "right",
    },
    bold: {
      fontWeight: "bold",
    },
    mono: {
      fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
    },
  }),
};
