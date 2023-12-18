"use client";

import { DaimoLinkStatus, daimoLinkBase } from "@daimo/common";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

import { AppOrWalletCTA } from "./AppOrWalletCTA";
import { PrimaryOpenInAppButton } from "../../../components/buttons";

export function CallToAction({
  description,
  walletActionLinkStatus,
}: {
  description: string;
  walletActionLinkStatus?: DaimoLinkStatus;
}) {
  // If we've connected another wallet, hide the Open in Daimo button.
  const { isConnected } = useAccount();

  const [directDeepLink, setDirectDeepLink] = useState<string>("");

  useEffect(() => {
    const directDeepLink = window.location.href.replace(
      daimoLinkBase,
      "daimo:/"
    );
    setDirectDeepLink(directDeepLink);
  }, [directDeepLink]);

  return (
    <>
      {walletActionLinkStatus ? (
        <AppOrWalletCTA
          linkStatus={walletActionLinkStatus}
          description={description}
        />
      ) : (
        <>
          <h1 className="text-xl font-semibold text-grayMid">{description}</h1>
          <div className="h-4" />
          <PrimaryOpenInAppButton />
        </>
      )}
      {!isConnected && (
        <a
          href={directDeepLink}
          className="block text-center text-primaryLight tracking-wider font-bold py-5"
        >
          ALREADY HAVE IT? OPEN IN DAIMO
        </a>
      )}
    </>
  );
}
