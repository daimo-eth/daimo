"use client";

import { useState } from "react";

import { detectPlatform, downloadMetadata } from "../utils/platform";

export function PrimaryOpenInAppButton({
  inviteDeepLink,
  disabled,
}: {
  inviteDeepLink?: string;
  disabled?: boolean;
}) {
  const [justCopied, setJustCopied] = useState(false);

  const onClick = async () => {
    const platform = detectPlatform(navigator.userAgent);
    const { url } = downloadMetadata[platform];

    if (inviteDeepLink) {
      await navigator.clipboard.writeText(inviteDeepLink);
      setJustCopied(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setTimeout(() => setJustCopied(false), 2000);
    }

    console.log("Redirecting to store: " + url);
    window.open(url, "_blank");
  };

  return (
    <button
      className={
        (justCopied ? "bg-success" : "bg-primaryLight") +
        " tracking-wider text-white font-bold py-5 w-full rounded-md disabled:opacity-50"
      }
      disabled={disabled}
      onClick={onClick}
    >
      {justCopied
        ? "COPIED, REDIRECTING..."
        : (inviteDeepLink ? "COPY INVITE AND " : "") + "GET DAIMO"}
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
