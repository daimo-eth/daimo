import { Platform, StyleSheet, TextStyle } from "react-native";

export const color = {
  status: {
    red: "#a00",
    yellow: "#a70",
    green: "#090",
  },
  black: "#000",
  gray: "#668",
  white: "#fff",
  primary: "#007aff",
  danger: "#f35369",
  bg: {
    lightGray: "#eee",
    lightYellow: "#fff6e6",
    blue: "#cce5ff",
  },
};

const textBase: TextStyle = {
  fontVariant: ["tabular-nums"],
};

export const touchHighlightUnderlay = {
  underlayColor: color.bg.blue,
  activeOpacity: 0.9,
};

export const ss = {
  container: StyleSheet.create({
    outerStretch: {
      flex: 1,
      padding: 16,
      paddingBottom: 48,
      backgroundColor: "#fff",
      alignItems: "stretch",
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    ph16: {
      paddingHorizontal: 16,
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
    body: {
      ...textBase,
      fontSize: 18,
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
    bold: {
      fontWeight: "bold",
    },
    mono: {
      fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
    },
  }),
  spacer: StyleSheet.create({
    w8: {
      width: 8,
    },
    w16: {
      width: 16,
    },
    w32: {
      width: 32,
    },
    w64: {
      width: 32,
    },
    h8: {
      height: 8,
    },
    h16: {
      height: 16,
    },
    h32: {
      height: 32,
    },
    h64: {
      height: 64,
    },
    h128: {
      height: 128,
    },
    h256: {
      height: 256,
    },
  }),
};
