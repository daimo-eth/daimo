import Image from "next/image";
import Link from "next/link";

/**
 * Show the app store badge for iOS or Android.
 */
export function AppStoreBadge({ platform }: { platform: "ios" | "android" }) {
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
