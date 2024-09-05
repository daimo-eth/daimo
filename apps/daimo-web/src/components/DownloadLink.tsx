"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { TextBold } from "./typography";
import { useI18N } from "../i18n/context";
import { detectPlatform, getDownloadMetadata } from "../utils/platform";

export function DownloadLink() {
  const i18n = useI18N();
  const i18 = i18n.components.downloadLink;
  return (
    <Link
      href={"/download"}
      target="_blank"
      className="px-9 py-5 bg-primary rounded-lg"
    >
      <TextBold>{i18.download()}</TextBold>
    </Link>
  );
}

export function DownloadLinkButton() {
  const i18n = useI18N();
  const i18 = i18n.components.downloadLink;
  return (
    <Link
      href={"/download"}
      target="_blank"
      className="flex items-center space-x-2 lg:space-x-4 rounded-lg py-[15px] px-[36px] bg-primary text-white font-semibold md:text-2xl tracking-tight whitespace-nowrap min-w-[240px] "
    >
      <div>{i18.download()}</div>
      <Image
        src={"/assets/daimo-qr-download.png"}
        width={72}
        height={72}
        alt="QR Code"
      />
    </Link>
  );
}

export function DownloadLinkButtonMobileNav() {
  const i18n = useI18N();
  const downloadMetadata = getDownloadMetadata(i18n);
  const [title, setTitle] = useState(downloadMetadata["ios"].title);

  useEffect(() => {
    if (detectPlatform(navigator.userAgent) === "android") {
      setTitle(downloadMetadata["android"].title);
    }
  }, [downloadMetadata]);

  return (
    <Link
      href={"/download"}
      target="_blank"
      className="flex items-center justify-center space-x-4 rounded-lg py-4 px-9 bg-primary text-white font-bold md:text-lg tracking-snug"
    >
      <div>{title}</div>
    </Link>
  );
}
