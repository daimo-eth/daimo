import { Platform, StyleSheet, TextStyle } from "react-native";

/** Match daimo-web tailwind config. Same name = refers to the same color. */
export const color = {
  primary: "#007aff",
  primaryBgLight: "#aaccff",
  danger: "#f35369",
  success: "#4cd964",
  successDark: "#009900",
  white: "#ffffff",
  ivoryDark: "#f2f2f2",
  grayLight: "#e2e2e2",
  grayMid: "#717171",
  grayDark: "#444",
  midnight: "#262626",
};

const textBase: TextStyle = {
  fontVariant: ["tabular-nums"],
  color: color.midnight,
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
    underlayColor: color.primaryBgLight + activeAlpha,
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
    light: {
      ...textBase,
      fontSize: 16,
      lineHeight: 20,
      color: color.grayMid,
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
