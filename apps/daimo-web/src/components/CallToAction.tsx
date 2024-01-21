"use client";

import {
  DaimoLinkStatus,
  daimoLinkBase,
  daimoLinkBaseFuture,
} from "@daimo/common";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

import { AppOrWalletCTA } from "./AppOrWalletCTA";
import { PrimaryOpenInAppButton } from "./buttons";

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
    // Must be loaded client-side to capture the hash part of the URL
    // for ephemeral notes.
    const { href } = window.location;
    setDirectDeepLink(
      href
        .replace(daimoLinkBase, "daimo:/")
        .replace(daimoLinkBaseFuture, "daimo:/")
    );
  }, [directDeepLink]);

  const isInvitePaymentLink = walletActionLinkStatus?.link.type === "notev2";

  return (
    <>
      {walletActionLinkStatus ? (
        <AppOrWalletCTA
          linkStatus={walletActionLinkStatus}
          description={description}
          directDeepLink={directDeepLink}
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
          ALREADY HAVE IT? OPEN {isInvitePaymentLink ? "INVITE" : "LINK"} IN
          DAIMO
        </a>
      )}
    </>
  );
}
