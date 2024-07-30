"use client";

import { DaimoLinkStatus } from "@daimo/common";
import { useState } from "react";

import { PrimaryOpenInAppButton, SecondaryButton } from "./buttons";
import { ConnectWalletFlow } from "./ConnectWalletFlow";

import { i18n } from "../i18n";
const i18 = i18n.components.connectWallet.misc;

export function AppOrWalletCTA({
  linkStatus,
  description,
  directDeepLink,
  isInvite,
}: {
  linkStatus: DaimoLinkStatus;
  directDeepLink?: string;
  description: string;
  isInvite: boolean;
}) {
  // If the secondary flow is triggered, hide the Open in Daimo button.
  const [isUsingSecondaryFlow, setIsUsingSecondaryFlow] = useState(false);

  return (
    <center>
      <PrimaryOpenInAppButton
        disabled={isUsingSecondaryFlow}
        inviteDeepLink={isInvite ? directDeepLink : undefined}
      />
      <div className="h-4" />
      {!isUsingSecondaryFlow && (
        <>
          <SecondaryButton
            onClick={() => {
              window.open(directDeepLink, "_blank");
            }}
          >
            {i18.alreadyHaveIt()}
          </SecondaryButton>
          <div className="h-4" />
        </>
      )}
      <ConnectWalletFlow
        linkStatus={linkStatus}
        description={description}
        setSecondary={() => setIsUsingSecondaryFlow(true)}
      />
    </center>
  );
}
