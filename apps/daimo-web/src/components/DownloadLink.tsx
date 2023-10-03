"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function DownloadLink() {
  const [, link] = useDownloadTitleLink();
  return (
    <Link
      href={link}
      target="_blank"
      className="text-primaryLight font-semibold text-sm"
    >
      Download
    </Link>
  );
}

export function DownloadLinkButton() {
  const [title, link] = useDownloadTitleLink();
  return (
    <Link
      href={link}
      target="_blank"
      className="inline-block rounded-lg py-7 px-9 bg-primaryLight text-white font-semibold md:text-xl tracking-wider"
    >
      {title}
    </Link>
  );
}

function useDownloadTitleLink() {
  const [[title, link], setTitleLink] = useState([
    "Download on App Store",
    "https://testflight.apple.com/join/j3ixWtuN",
  ]);

  useEffect(() => {
    if (navigator.userAgent.toLowerCase().includes("android")) {
      setTitleLink([
        "Download on Play Store",
        "https://play.google.com/store/apps/details?id=com.daimo",
      ]);
    }
  }, []);

  return [title, link];
}
