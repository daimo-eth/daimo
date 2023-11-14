"use client";
import { daimoLinkBase } from "@daimo/common";
import { useState } from "react";

import { detectPlatform, downloadMetadata } from "../utils/platform";

export function PrimaryOpenInAppButton({ disabled }: { disabled?: boolean }) {
  const [openInApp, setOpenInApp] = useState(false);

  function getCurrentInAppUrl() {
    const url = window.location.href;
    const inAppUrl = url.startsWith(daimoLinkBase)
      ? "daimo://" + url.substring(daimoLinkBase.length + 1)
      : "daimo://"; // Just open the app without a deeplink
    console.log("Redirecting to In App URL: ", inAppUrl);
    return inAppUrl;
  }

  const onClick = () => {
    if (openInApp) {
      window.open(getCurrentInAppUrl(), "_blank");
      return;
    }

    const platform = detectPlatform(navigator.userAgent);
    window.open(downloadMetadata[platform].url, "_blank");
    setOpenInApp(true);
  };

  return (
    <button
      className="bg-primaryLight tracking-wider text-white font-bold py-5 w-full rounded-md disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
    >
      {openInApp ? "OPEN IN DAIMO" : "GET DAIMO"}
    </button>
  );
}

export function SecondaryButton({
  onClick,
  children,
  buttonType,
  disabled,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  buttonType?: "danger" | "success";
  disabled?: boolean;
}) {
  const buttonColors = (() => {
    switch (buttonType) {
      case "danger":
        return "text-danger border-danger";
      case "success":
        return "text-success border-success";
      default:
        return "text-primaryLight border-primaryLight";
    }
  })();

  return (
    <button
      disabled={disabled}
      className={
        "tracking-wider font-bold py-5 w-full rounded-md border-2 " +
        buttonColors
      }
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
