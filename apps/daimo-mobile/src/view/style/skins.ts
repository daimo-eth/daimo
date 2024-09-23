/**
 * !! MOD DAIMO !!
 *
 * To make your own Daimo skin, first, create a custom colorway in colorway.ts.
 * Then, choose a font and a selector logo. Finally, create a optional
 * background component for the home screen.
 */

import {
  ImageSourcePropType,
  Platform,
  TextStyle,
  StyleSheet,
} from "react-native";

import {
  greenColorway,
  blueColorway,
  orangeColorway,
  darkColorway,
  yellowColorway,
} from "./colorway";

export type Colorway = typeof blueColorway;
export type SkinStyleSheet = ReturnType<typeof getSS>;
type TouchHighlightUnderlay = ReturnType<typeof getUnderlay>;

export interface SkinContextType {
  name: SkinName;
  color: Colorway;
  ss: SkinStyleSheet;
  touchHighlightUnderlay: TouchHighlightUnderlay;
  logo: ImageSourcePropType; // Skin Selector Logo
  font?: string;
}

// Only for iOS devices
const iosFonts = {
  default: "San Francisco",
  chalkboard: "ChalkboardSE-Light",
  courier: "CourierNewPSMT",
  arial: "Arial Rounded MT Bold",
};

export const Skin = {
  usdc: "usdc",
  doge: "doge",
  usdt: "usdt",
  bitcoin: "bitcoin",
  penguin: "penguin",
  duck: "duck",
} as const;

export type SkinName = (typeof Skin)[keyof typeof Skin];

export const skins: Record<SkinName, SkinContextType> = {
  // OG Daimo blue
  [Skin.usdc]: createSkin({
    name: Skin.usdc,
    color: blueColorway,
    font: Platform.select({
      ios: iosFonts.default,
      default: undefined,
    }),
    logo: {
      uri: "https://daimo.com/assets/deposit/usdc.png",
    },
  }),
  // Normie money green
  [Skin.usdt]: createSkin({
    name: Skin.usdt,
    color: greenColorway,
    font: Platform.select({
      ios: iosFonts.default,
      default: undefined,
    }),
    logo: {
      uri: "https://assets.coingecko.com/coins/images/32884/large/USDT.PNG",
    },
  }),
  // For Elon & Adhyyan
  [Skin.doge]: createSkin({
    name: Skin.doge,
    color: orangeColorway,
    font: Platform.select({
      ios: iosFonts.chalkboard,
      default: undefined,
    }),
    logo: require("../../../assets/skins/dogecoin.png"),
  }),
  // Bitcoin is soooo BACK
  [Skin.bitcoin]: createSkin({
    name: Skin.bitcoin,
    color: darkColorway,
    font: Platform.select({
      ios: iosFonts.courier,
      default: undefined,
    }),
    logo: {
      uri: "https://assets.coingecko.com/coins/images/32883/large/wbtc.png",
    },
  }),
  // Club Penguin, just for kicks
  [Skin.penguin]: createSkin({
    name: Skin.penguin,
    color: blueColorway,
    font: Platform.select({
      ios: iosFonts.arial,
      default: undefined,
    }),
    logo: require("../../../assets/skins/penguin2.png"),
  }),
  // Rubber ducky
  [Skin.duck]: createSkin({
    name: Skin.duck,
    color: yellowColorway,
    font: Platform.select({
      ios: iosFonts.arial,
      default: undefined,
    }),
    logo: require("../../../assets/skins/duck.png"),
  }),
  // ADD MORE SKINS HERE
};

// ---------- Skin Creation functions ----------

function createSkin({
  name,
  color,
  logo,
  font,
}: {
  name: SkinName;
  color: Colorway;
  logo: ImageSourcePropType;
  font?: string;
}): SkinContextType {
  return {
    name,
    color,
    font,
    ss: getSS(color, font),
    touchHighlightUnderlay: getUnderlay(color),
    logo,
  };
}

function getSS(color: Colorway, font?: string) {
  const textBaseWithoutFont: TextStyle = {
    fontVariant: ["tabular-nums"],
    color: color.midnight,
  };
  const textBase = font
    ? { ...textBaseWithoutFont, fontFamily: font }
    : textBaseWithoutFont;

  return {
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
}

const activeAlpha = "aa";
function getUnderlay(color: Colorway) {
  return {
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
}
