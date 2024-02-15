"use client";

import { DaimoLinkStatus } from "@daimo/common";
import Link from "next/link";
import { useState } from "react";

import { PrimaryOpenInAppButton } from "./buttons";
import { ConnectWalletFlow } from "./ConnectWalletFlow";
import { UrlSearchParams, getQueryParam } from "../utils/url";

export function AppOrWalletCTA({
  linkStatus,
  description,
  directDeepLink,
  isInvite,
  searchParams,
}: {
  linkStatus: DaimoLinkStatus;
  directDeepLink?: string;
  description: string;
  isInvite: boolean;
  searchParams: UrlSearchParams;
}) {
  const [isUsingSecondaryFlow, setIsUsingSecondaryFlow] = useState(false);

  const recButton = getQueryParam(searchParams["recButton"]);
  const recURL = getQueryParam(searchParams["recURL"]);

  return (
    <center>
      {recButton && recURL && !isUsingSecondaryFlow && (
        <center>
          <Link
            href={recURL}
            className="block bg-primaryLight tracking-wider text-white font-bold py-5 w-full rounded-md disabled:opacity-50"
          >
            {recButton}
          </Link>
          <div className="h-4" />
        </center>
      )}
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
