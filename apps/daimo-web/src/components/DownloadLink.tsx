"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { detectPlatform, downloadMetadata } from "../utils/platform";

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
    downloadMetadata["ios"].title,
    downloadMetadata["ios"].url,
  ]);

  useEffect(() => {
    if (detectPlatform(navigator.userAgent) === "android") {
      setTitleLink([
        downloadMetadata["android"].title,
        downloadMetadata["android"].url,
      ]);
    }
  }, []);

  return [title, link];
}
