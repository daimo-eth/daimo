const IS_DEV = process.env.DAIMO_APP_VARIANT === "dev";

const VERSION = "1.5.0";
const BUILD_NUM = 99;

export default {
  owner: "daimo",
  name: IS_DEV ? "Daimo Dev" : "Daimo",
  slug: "daimo",
  version: VERSION,
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  assetBundlePatterns: ["assets/*"],
  scheme: "daimo",
  notification: {
    iosDisplayInForeground: true,
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: IS_DEV ? "com.daimo.dev" : "com.daimo",
    buildNumber: `${BUILD_NUM}`,
    associatedDomains: [
      "applinks:daimo.xyz",
      "applinks:daimo.com",
      "webcredentials:daimo.xyz",
      "webcredentials:daimo.com",
    ],
    config: {
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      LSApplicationQueriesSchemes: ["whatsapp", "sgnl", "tg", "mailto", "sms"],
      NFCReaderUsageDescription: "Daimo uses NFC for tap-to-pay checkout.",
    },
  },
  android: {
    googleServicesFile: IS_DEV
      ? "./google-services-dev.json"
      : "./google-services.json",
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "https",
            host: "daimo.com",
            pathPrefix: "/link",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "https",
            host: "daimo.xyz",
            pathPrefix: "/link",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
      {
        action: "NDEF_DISCOVERED",
        autoVerify: true,
        data: [
          {
            scheme: "https",
            host: "daimo.com",
            pathPrefix: "/link",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "https",
            host: "daimo.com",
            pathPrefix: "/l",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
      {
        action: "NDEF_DISCOVERED",
        autoVerify: true,
        data: [
          {
            scheme: "https",
            host: "daimo.com",
            pathPrefix: "/l",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    softwareKeyboardLayoutMode: "pan",
    package: IS_DEV ? "com.daimo.dev" : "com.daimo",
    versionCode: BUILD_NUM,
  },
  extra: {
    eas: {
      projectId: "1eff7c6e-e88b-4e35-8b31-eab7e6814904",
    },
  },
  plugins: [
    [
      "expo-build-properties",
      {
        android: {
          compileSdkVersion: 34,
          targetSdkVersion: 34,
          minSdkVersion: 28,
          buildToolsVersion: "34.0.0",
          kotlinVersion: "1.8.0",
        },
        ios: {
          deploymentTarget: "15.0",
        },
      },
    ],
    [
      "expo-local-authentication",
      {
        faceIDPermission:
          "Allows Daimo to protect your account and authenticate you when you send payments.",
      },
    ],
    ["expo-notifications"],
    [
      "expo-barcode-scanner",
      {
        cameraPermission:
          "Allows Daimo to scan QR codes to pay other users or add new devices to your account.",
      },
    ],
    [
      "expo-contacts",
      {
        contactsPermission:
          "Allows Daimo to find and pay your friends. Your contacts remain private and are never uploaded or shared.",
      },
    ],
    ["react-native-nfc-manager"],
    ["./android-deeplink-config-plugin", "custom"],
  ],
};
