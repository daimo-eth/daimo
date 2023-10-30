export type PlatformType = "ios" | "android" | "other";

export function detectPlatform(ua: string): PlatformType {
  // From https://dev.to/konyu/using-javascript-to-determine-whether-the-client-is-ios-or-android-4i1j
  if (/android/i.test(ua)) {
    return "android";
  } else if (/iPhone|iPod/.test(ua)) {
    return "ios";
  }
  return "other";
}

// Mac app store 👀
export const downloadMetadata = {
  ios: {
    title: "Download on App Store",
    url: "https://apps.apple.com/us/app/daimo/id6459700343",
    image: "/badge-app-store.svg",
  },
  android: {
    title: "Get it on Google Play",
    url: "https://play.google.com/store/apps/details?id=com.daimo",
    image: "/badge-play-store.svg",
  },
  other: {
    title: "Download on App Store",
    url: "https://apps.apple.com/us/app/daimo/id6459700343",
    image: "/badge-app-store.svg",
  },
};
