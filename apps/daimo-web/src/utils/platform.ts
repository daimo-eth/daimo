import { appStoreLinks } from "@daimo/common";

import { getAbsoluteUrl } from "./getAbsoluteUrl";

export type PlatformType = "ios" | "android" | "other";

export function detectPlatform(ua: string): PlatformType {
  // From https://dev.to/konyu/using-javascript-to-determine-whether-the-client-is-ios-or-android-4i1j
  if (/android/i.test(ua)) {
    return "android";
  } else if (/iPhone|iPod|iPad/.test(ua)) {
    return "ios";
  }
  return "other";
}

export const downloadMetadata = {
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
