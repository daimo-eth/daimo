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

export function getDownloadMetadata(i18n: LangDef) {
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
