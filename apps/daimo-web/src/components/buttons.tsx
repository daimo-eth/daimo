"use client";

import { useState } from "react";

import { useI18N } from "../i18n/context";
import { detectPlatform, getDownloadMetadata } from "../utils/platform";

export function PrimaryOpenInAppButton({
  inviteDeepLink,
  disabled,
}: {
  inviteDeepLink?: string;
  disabled?: boolean;
}) {
  const i18n = useI18N();
  const i18 = i18n.callToAction;

  const [justCopied, setJustCopied] = useState(false);

  const onClick = async () => {
    const platform = detectPlatform(navigator.userAgent);
    const { url } = getDownloadMetadata(i18n)[platform];

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
    <PrimaryButton
      disabled={disabled}
      onClick={onClick}
      buttonType={justCopied ? "success" : undefined}
    >
      {justCopied
        ? i18.justCopiedLink()
        : inviteDeepLink
        ? i18.copyAndInstall()
        : i18.install()}
    </PrimaryButton>
  );
}

type ButtonProps = {
  onClick?: () => void;
  children: React.ReactNode;
  buttonType?: "danger" | "success";
  disabled?: boolean;
};

function getButtonTextAndBorder(buttonType?: "danger" | "success") {
  switch (buttonType) {
    case "danger":
      return "text-danger border-danger";
    case "success":
      return "text-success border-success";
    default:
      return "text-primary border-primary";
  }
}

export function PrimaryButton({
  onClick,
  children,
  buttonType,
  disabled,
}: ButtonProps) {
  const background = buttonType === "success" ? "bg-success" : "bg-primary";

  return (
    <button
      className={
        "tracking-wider text-white font-bold py-5 w-full rounded-md disabled:opacity-50 " +
        background +
        " " +
        getButtonTextAndBorder(buttonType)
      }
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  onClick,
  children,
  buttonType,
  disabled,
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={
        "tracking-wider font-bold py-5 w-full rounded-md border-2 " +
        getButtonTextAndBorder(buttonType)
      }
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

export function TextButton({
  children,
  onClick,
  buttonType,
  disabled,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  buttonType?: "danger" | "success";
  disabled?: boolean;
}) {
  const textColors = (() => {
    switch (buttonType) {
      case "danger":
        return "text-danger";
      case "success":
        return "text-success";
      default:
        return "text-primary";
    }
  })();

  return (
    <button
      disabled={disabled}
      className={
        "block text-center tracking-wider font-semibold py-8 " + textColors
      }
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
