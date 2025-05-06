"use client";

import {
  DaimoLinkStatus,
  daimoLinkBase,
  daimoLinkBaseV2,
  getInviteStatus,
} from "@daimo/common";
import { useEffect, useState } from "react";

import { AppOrWalletCTA } from "./AppOrWalletCTA";
import { PrimaryOpenInAppButton, SecondaryButton } from "./buttons";
import { useI18N } from "../i18n/context";

export function CallToAction({
  description,
  linkStatus,
}: {
  description: string;
  linkStatus?: DaimoLinkStatus;
}) {
  const i18n = useI18N();
  const i18 = i18n.callToAction;

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
          <div className="h-4" />
          <SecondaryButton
            onClick={() => {
              window.open(directDeepLink, "_blank");
            }}
          >
            {i18.openInApp()}
          </SecondaryButton>
        </>
      )}
    </>
  );
}
