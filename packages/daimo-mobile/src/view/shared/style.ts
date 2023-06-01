import { StyleSheet, TextStyle, Platform } from "react-native";

export const color = {
  status: {
    red: "#a00",
    yellow: "#a70",
    green: "#090",
  },
  black: "#000",
  gray: "#668",
  white: "#fff",
  bg: {
    lightGray: "#eee",
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
  text: StyleSheet.create({
    h1: {
      ...textBase,
      fontSize: 24,
      fontWeight: "bold",
    },
    h2: {
      ...textBase,
      fontSize: 18,
      fontWeight: "bold",
    },
    body: {
      ...textBase,
      fontSize: 16,
    },
    bodyBold: {
      ...textBase,
      fontSize: 16,
      fontWeight: "bold",
    },
    bodyGray: {
      ...textBase,
      fontSize: 16,
      color: color.gray,
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
  }),
};
