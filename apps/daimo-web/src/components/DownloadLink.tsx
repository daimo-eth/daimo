"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { TextBold } from "./typography";
import { detectPlatform, downloadMetadata } from "../utils/platform";

export function DownloadLink() {
  const [, link] = useDownloadTitleLink();
  return (
    <Link
      href={link}
      target="_blank"
      className="px-9 py-5 bg-primaryLight rounded-lg"
    >
      <TextBold>Download</TextBold>
    </Link>
  );
}

export function DownloadLinkButton() {
  const [title, link] = useDownloadTitleLink();
  return (
    <Link
      href={link}
      target="_blank"
      className="flex items-center space-x-4 rounded-lg py-7 px-9 bg-primaryLight text-white font-semibold md:text-2xl tracking-tight"
    >
      <div>{title}</div>
      <Image
        src={"/assets/daimo-qr-download.png"}
        width={48}
        height={48}
        alt="QR Code"
      />
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

export function DownloadLinkButtonMobileNav() {
  const [title, link] = useDownloadTitleLink();
  return (
    <Link
      href={link}
      target="_blank"
      className="flex items-center justify-center space-x-4 rounded-lg py-4 px-9 bg-primaryLight text-white font-medium md:text-lg tracking-tight"
    >
      <div>{title}</div>
    </Link>
  );
}
