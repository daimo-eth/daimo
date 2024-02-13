"use client";

import { DaimoLinkStatus } from "@daimo/common";
import { useState } from "react";

import { PrimaryOpenInAppButton } from "./buttons";
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
  const [isUsingSecondaryFlow, setIsUsingSecondaryFlow] = useState(false);

  return (
    <center>
      <PrimaryOpenInAppButton
        disabled={isUsingSecondaryFlow}
        inviteDeepLink={isInvite ? directDeepLink : undefined}
      />
      <div className="h-4" />
      <ConnectWalletFlow
        linkStatus={linkStatus}
        description={description}
        setSecondary={() => setIsUsingSecondaryFlow(true)}
      />
    </center>
  );
}
