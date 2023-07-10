import { Platform, StyleSheet, TextStyle } from "react-native";

export const color = {
  status: {
    red: "#a00",
    yellow: "#a70",
    green: "#090",
  },
  black: "#000",
  gray: "#668",
  darkGray: "#222",
  white: "#fff",
  primary: "#007aff",
  danger: "#f35369",
  bg: {
    lightGray: "#eee",
    midGray: "#ccc",
    lightYellow: "#fff6e6",
    blue: "#cce5ff",
  },
};

const textBase: TextStyle = {
  fontVariant: ["tabular-nums"],
  color: color.black,
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
    vertModal: {
      flex: 1,
      flexDirection: "column",
      backgroundColor: color.white,
      alignSelf: "stretch",
      padding: 16,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    ph8: {
      paddingHorizontal: 8,
    },
    ph16: {
      paddingHorizontal: 16,
    },
    mhn16: {
      marginHorizontal: -16,
    },
    h256: {
      height: 256,
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
