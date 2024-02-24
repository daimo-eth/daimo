"use client";

import {
  DaimoLinkStatus,
  daimoLinkBase,
  daimoLinkBaseV2,
  getInviteStatus,
} from "@daimo/common";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

import { AppOrWalletCTA } from "./AppOrWalletCTA";
import { PrimaryOpenInAppButton } from "./buttons";

export function CallToAction({
  description,
  linkStatus,
}: {
  description: string;
  linkStatus?: DaimoLinkStatus;
}) {
  // If we've connected another wallet, hide the Open in Daimo button.
  const { isConnected } = useAccount();

  const [directDeepLink, setDirectDeepLink] = useState<string>("");

  const isInvite = !!linkStatus && getInviteStatus(linkStatus).isValid;
  const isWalletAction =
    !!linkStatus &&
    ["request", "requestv2", "note", "notev2"].includes(linkStatus.link.type);

  useEffect(() => {
    // Must be loaded client-side to capture the hash part of the URL
    // for ephemeral notes.
    const { href } = window.location;
    setDirectDeepLink(
      href.replace(daimoLinkBase, "daimo:/").replace(daimoLinkBaseV2, "daimo:/")
    );
  }, [directDeepLink]);

  return (
    <>
      {isWalletAction ? (
        <AppOrWalletCTA
          linkStatus={linkStatus}
          description={description}
          directDeepLink={directDeepLink}
          isInvite={isInvite}
        />
      ) : (
        <>
          <h1 className="text-xl font-semibold text-grayMid">{description}</h1>
          <div className="h-4" />
          <PrimaryOpenInAppButton
            inviteDeepLink={isInvite ? directDeepLink : undefined}
          />
        </>
      )}
      {!isConnected && (
        <a
          href={directDeepLink}
          className="block text-center text-primaryLight tracking-wider font-bold py-5"
        >
          ALREADY HAVE IT? OPEN {isInvite ? "INVITE" : "LINK"} IN DAIMO
        </a>
      )}
    </>
  );
}
