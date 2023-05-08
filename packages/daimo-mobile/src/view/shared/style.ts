import { StyleSheet, TextStyle } from "react-native";

export const color = {
  status: {
    red: "#a00",
    yellow: "#a70",
    green: "#090",
  },
  black: "#000",
  gray: "#668",
  white: "#fff",
};

const textBase: TextStyle = {
  fontVariant: ["tabular-nums"],
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
  }),
};
