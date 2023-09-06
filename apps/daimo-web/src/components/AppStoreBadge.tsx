"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Show the app store badge for iOS or Android.
 */
function SingleStoreBadge({ platform }: { platform: "ios" | "android" }) {
  const url = "https://notionforms.io/forms/daimo-uk2fe4";
  const image =
    platform === "ios" ? "/badge-app-store.svg" : "/badge-play-store.svg";
  const alt =
    platform === "ios" ? "Download on the App Store" : "Get it on Google Play";

  return (
    <Link href={url} target="_blank">
      <Image src={image} alt={alt} width={140} height={42} />
    </Link>
  );
}

type PlatformType = "ios" | "android" | "other";

function detectPlatform(ua: string): PlatformType {
  // From https://dev.to/konyu/using-javascript-to-determine-whether-the-client-is-ios-or-android-4i1j
  if (/android/i.test(ua)) {
    return "android";
  } else if (/iPhone|iPod/.test(ua)) {
    return "ios";
  }
  return "other";
}

export function AppStoreBadge() {
  const [platform, setPlatform] = useState<PlatformType>("other");

  // Can't SSR the UA
  useEffect(() => {
    setPlatform(detectPlatform(navigator.userAgent));
  }, []);

  return (
    <div className="flex flex-row gap-4 justify-center">
      {platform !== "android" && <SingleStoreBadge platform="ios" />}
      {platform !== "ios" && <SingleStoreBadge platform="android" />}
    </div>
  );
}
