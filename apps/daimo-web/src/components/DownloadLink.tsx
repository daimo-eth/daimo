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
      className="text-white font-semibold text-sm px-9 py-5 bg-primaryLight rounded-lg"
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
