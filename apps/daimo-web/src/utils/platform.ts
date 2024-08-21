import { appStoreLinks, PlatformType } from "@daimo/common";

import { getAbsoluteUrl } from "./getAbsoluteUrl";
import { LangDef } from "../i18n/languages/en";

export function detectPlatform(ua: string): PlatformType {
  // From https://dev.to/konyu/using-javascript-to-determine-whether-the-client-is-ios-or-android-4i1j
  if (/android/i.test(ua)) {
    return "android";
  } else if (/iPhone|iPod|iPad/.test(ua)) {
    return "ios";
  }
  return "other";
}

// necesary for some routes
const downloadMetadata = {
  ios: {
    title: "Download on App Store",
    url: appStoreLinks.ios,
    image: "/badge-app-store.svg",
  },
  mac: {
    title: "Download on Mac App Store",
    url: appStoreLinks.ios,
    image: "/badge-app-store.svg",
  },
  android: {
    title: "Get it on Google Play",
    url: appStoreLinks.android,
    image: "/badge-play-store.svg",
  },
  other: {
    title: "Download on App Store or Google Play",
    url: getAbsoluteUrl(`/download/other`),
  },
};

export function getDownloadMetadata(i18n: LangDef): typeof downloadMetadata {
  const i18 = i18n.download.platforms;

  return {
    ios: {
      title: i18.ios.title(),
      url: appStoreLinks.ios,
      image: "/badge-app-store.svg",
    },
    mac: {
      title: i18.mac.title(),
      url: appStoreLinks.ios,
      image: "/badge-app-store.svg",
    },
    android: {
      title: i18.android.title(),
      url: appStoreLinks.android,
      image: "/badge-play-store.svg",
    },
    other: {
      title: i18.other.title(),
      url: getAbsoluteUrl(`/download/other`),
    },
  };
}
