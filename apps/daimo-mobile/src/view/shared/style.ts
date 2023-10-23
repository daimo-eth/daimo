import { Platform, StyleSheet, TextStyle } from "react-native";

/** Match daimo-web tailwind config. Same name = refers to the same color. */
export const color = {
  primary: "#007aff",
  primaryBgLight: "#aaccff",
  danger: "#f35369",
  success: "#0CA01B",
  successDark: "#009900",
  white: "#ffffff",
  ivoryDark: "#f2f2f2",
  grayLight: "#e2e2e2", // TODO gray2 = d6d6d6
  gray3: "#aaaaaa",
  grayMid: "#717171", // TODO gray4
  grayDark: "#444", // TODO gray5
  midnight: "#262626", // TODO "black" = 111111
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

export const ss = {
  container: StyleSheet.create({
    screen: {
      flex: 1,
      flexDirection: "column",
      alignItems: "stretch",
      backgroundColor: color.white,
      paddingHorizontal: 16,
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
      fontWeight: "600",
    },
    h2: {
      ...textBase,
      fontSize: 24,
      fontWeight: "600",
    },
    h3: {
      ...textBase,
      fontSize: 20,
      fontWeight: "600",
    },
    body: {
      ...textBase,
      fontSize: 16,
      fontWeight: "600",
    },
    metadata: {
      ...textBase,
      fontSize: 13,
      fontWeight: "600",
    },
    metadataLight: {
      ...textBase,
      fontSize: 13,
      fontWeight: "600",
      color: color.gray3,
    },
    light: {
      ...textBase,
      fontSize: 16,
      fontWeight: "600",
      color: color.gray3,
    },
    error: {
      ...textBase,
      fontSize: 16,
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
