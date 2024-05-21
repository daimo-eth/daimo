import { Platform, StyleSheet, TextStyle } from "react-native";

/** Match daimo-web tailwind config. Same name = refers to the same color. */
export const color = {
  primary: "#13915F",
  primaryBgLight: "#CCF3D7",
  danger: "#f35369",
  warningLight: "#ffeeb3",
  yellow: "#FFDC62",
  success: "#14B174",
  successDark: "#13915F",
  white: "#ffffff",
  ivoryLight: "#f9f9f9",
  ivoryDark: "#f2f2f2",
  grayLight: "#e2e2e2", // TODO gray2 = d6d6d6
  gray3: "#aaaaaa",
  grayMid: "#717171", // TODO gray4
  grayDark: "#444", // TODO gray5
  midnight: "#262626", // TODO "black" = 111111
  link: "#027AFE",
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
    screenWithoutPadding: {
      flex: 1,
      flexDirection: "column",
      alignItems: "stretch",
      backgroundColor: color.white,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    flexGrow: {
      flexGrow: 1,
    },
    topBottom: {
      flexGrow: 1,
      flexDirection: "column",
      justifyContent: "space-between",
    },
    padH8: {
      paddingHorizontal: 8,
    },
    padH16: {
      paddingHorizontal: 16,
    },
    padH24: {
      paddingHorizontal: 24,
    },
    marginHNeg16: {
      marginHorizontal: -16,
    },
    debug: {
      borderWidth: 1,
      borderColor: "#f00",
    },
    shadow: {
      // iOS
      shadowOffset: { height: 2, width: -1 },
      shadowOpacity: 0.05,
      // Android
      elevation: 1,
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
    bodyCaps: {
      ...textBase,
      fontSize: 16,
      fontWeight: "600",
      letterSpacing: 0.6,
    },
    bodyMedium: {
      ...textBase,
      fontSize: 16,
      fontWeight: "500",
    },
    para: {
      ...textBase,
      fontSize: 16,
      fontWeight: "500",
      lineHeight: 28,
    },
    btnCaps: {
      ...textBase,
      fontSize: 14,
      fontWeight: "700",
      letterSpacing: 0.8,
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
    dropdown: {
      ...textBase,
      fontSize: 17,
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
    emphasizedSmallText: {
      ...textBase,
      fontWeight: "600",
      fontSize: 12,
    },
    link: {
      color: color.link,
      fontSize: 16,
      fontWeight: "600",
    },
  }),
};
