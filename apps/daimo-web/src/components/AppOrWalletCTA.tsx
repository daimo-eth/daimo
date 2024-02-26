"use client";

import { DaimoLinkStatus } from "@daimo/common";
import { useState } from "react";

import { PrimaryOpenInAppButton, SecondaryButton } from "./buttons";
import { ConnectWalletFlow } from "./ConnectWalletFlow";

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
        <SecondaryButton
          onClick={() => {
            window.open(directDeepLink, "_blank");
          }}
        >
          ALREADY HAVE IT? OPEN {isInvite ? "INVITE" : "LINK"} IN APP
        </SecondaryButton>
      )}
      <ConnectWalletFlow
        linkStatus={linkStatus}
        description={description}
        setSecondary={() => setIsUsingSecondaryFlow(true)}
      />
    </center>
  );
}
