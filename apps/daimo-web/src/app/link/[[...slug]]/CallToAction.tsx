"use client";

import { DaimoLinkStatus } from "@daimo/common";
import { useAccount } from "wagmi";

import { AppOrWalletCTA } from "./AppOrWalletCTA";
import { PrimaryOpenInAppButton } from "../../../components/buttons";

export function CallToAction({
  description,
  walletActionLinkStatus,
  directDeepLink,
}: {
  description: string;
  walletActionLinkStatus?: DaimoLinkStatus;
  directDeepLink: string;
}) {
  // If we've connected another wallet, hide the Open in Daimo button.
  const { isConnected } = useAccount();

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
