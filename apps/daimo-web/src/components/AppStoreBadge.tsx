"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  PlatformType,
  detectPlatform,
  downloadMetadata,
} from "../utils/platform";

/**
 * Show the app store badge for iOS or Android.
 */
function SingleStoreBadge({ platform }: { platform: "ios" | "android" }) {
  const { url, image, title: alt } = downloadMetadata[platform];

  return (
    <Link href={url} target="_blank">
      <Image src={image} alt={alt} width={140} height={42} />
    </Link>
  );
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
