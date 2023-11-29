"use client";

import { detectPlatform, downloadMetadata } from "../utils/platform";

export function PrimaryOpenInAppButton({ disabled }: { disabled?: boolean }) {
  const onClick = () => {
    const platform = detectPlatform(navigator.userAgent);
    const { url } = downloadMetadata[platform];
    console.log("Redirecting to store: " + url);
    window.open(url, "_blank");
  };

  return (
    <button
      className="bg-primaryLight tracking-wider text-white font-bold py-5 w-full rounded-md disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
    >
      GET DAIMO
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
