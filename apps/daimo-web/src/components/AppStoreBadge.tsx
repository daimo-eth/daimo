import Image from "next/image";

/**
 * Show the app store badge for iOS or Android.
 */
export function AppStoreBadge({ platform }: { platform: "ios" | "android" }) {
  const url = "javascript:alert('Coming soon')"; // eslint-disable-line
  const image =
    platform === "ios" ? "/badge-app-store.svg" : "/badge-play-store.svg";
  const alt =
    platform === "ios" ? "Download on the App Store" : "Get it on Google Play";

  return (
    <a href={url}>
      <Image src={image} alt={alt} width={140} height={42} />
    </a>
  );
}
