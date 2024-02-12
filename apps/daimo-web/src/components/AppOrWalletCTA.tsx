"use client";

import { DaimoLinkStatus } from "@daimo/common";
import { useState } from "react";

import { PrimaryOpenInAppButton } from "./buttons";
import { ConnectWalletFlow } from "./ConnectWalletFlow";

export function AppOrWalletCTA({
  linkStatus,
  description,
  directDeepLink,
}: {
  linkStatus: DaimoLinkStatus;
  directDeepLink?: string;
  description: string;
}) {
  const [isUsingSecondaryFlow, setIsUsingSecondaryFlow] = useState(false);

  const isInvitePaymentLink = linkStatus.link.type === "notev2";

  return (
    <center>
      <PrimaryOpenInAppButton
        disabled={isUsingSecondaryFlow}
        inviteDeepLink={isInvitePaymentLink ? directDeepLink : undefined}
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
