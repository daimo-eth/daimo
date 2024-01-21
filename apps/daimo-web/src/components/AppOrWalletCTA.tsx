"use client";

import {
  DaimoLinkStatus,
  DaimoNoteStatus,
  DaimoRequestStatus,
  assert,
  getNoteClaimSignature,
  getNoteClaimSignatureFromSeed,
} from "@daimo/common";
import {
  daimoEphemeralNotesConfig,
  daimoEphemeralNotesV2Address,
  daimoEphemeralNotesV2Config,
} from "@daimo/contract";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useMemo, useState } from "react";
import { Address, Hex, InsufficientFundsError, parseUnits } from "viem";
import {
  erc20ABI,
  useAccount,
  useContractWrite,
  useNetwork,
  usePrepareContractWrite,
} from "wagmi";

import { PrimaryOpenInAppButton, SecondaryButton } from "./buttons";
import { chainConfig } from "../env";

export function AppOrWalletCTA({
  linkStatus,
  description,
  directDeepLink,
}: {
  linkStatus: DaimoLinkStatus;
  directDeepLink?: string;
  description: string;
}) {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();

  const [action, setAction] = useState<Action>();
  const [creationError, setCreationError] = useState<string>();
  const { config, error } = usePrepareContractWrite(action?.wagmiPrep);
  const { data, isLoading, isSuccess, write } = useContractWrite(config);

  const humanReadableError = useMemo(() => {
    if (creationError !== undefined) return creationError;

    if (!error || !error.message) return undefined;
    if (error.message.match(/ERC20: transfer amount exceeds balance/)) {
      return "Not enough USDC in wallet";
    } else if (error.message.match(/note does not exist/)) {
      return "Already claimed"; // Only shown on cached load
    } else if (error instanceof InsufficientFundsError) {
      return "Insufficient ETH for transaction gas";
    } else {
      return error.message;
    }
  }, [error, creationError]);

  useEffect(() => {
    (async () => {
      try {
        if (!address) return;

        // URL hash part is not readable server side.
        const hash = window.location.hash.slice(1);

        const action = await linkStatusToAction(linkStatus, address, hash);
        setAction(action);
      } catch (e: any) {
        setCreationError(e.message);
      }
    })();
  }, [linkStatus, address]);

  const descriptionVerb = description.split(" ")[0].toUpperCase();
  const secondaryTitle = descriptionVerb + " WITH CONNECTED WALLET";
  const secondaryConnectTitle = descriptionVerb + " WITH ANOTHER WALLET";

  const isInvitePaymentLink = linkStatus.link.type === "notev2";

  return (
    <center>
      <PrimaryOpenInAppButton
        disabled={isLoading || isSuccess}
        inviteDeepLink={isInvitePaymentLink ? directDeepLink : undefined}
      />
      <div className="h-4" />
      {isConnected && humanReadableError === undefined && (
        <>
          <SecondaryButton
            disabled={!write || isLoading}
            onClick={() => {
              if (isSuccess && data?.hash)
                window.open(
                  chain?.blockExplorers!.default.url + "/tx/" + data?.hash,
                  "_blank"
                );
              else write?.();
            }}
            buttonType={isSuccess ? "success" : undefined}
          >
            {isLoading
              ? "SENDING"
              : isSuccess
              ? "VIEW ON BLOCK EXPLORER"
              : secondaryTitle}
          </SecondaryButton>
          <div className="h-4" />
        </>
      )}
      {isConnected && humanReadableError !== undefined && (
        <>
          <SecondaryButton disabled buttonType="danger">
            {humanReadableError.toUpperCase()}
          </SecondaryButton>
          <div className="h-4" />
        </>
      )}
      <CustomConnectButton title={secondaryConnectTitle} />
    </center>
  );
}

function CustomConnectButton({ title }: { title: string }): JSX.Element {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <SecondaryButton onClick={openConnectModal}>
                    {title}
                  </SecondaryButton>
                );
              }

              if (chain.unsupported) {
                return (
                  <SecondaryButton onClick={openChainModal} buttonType="danger">
                    WRONG NETWORK
                  </SecondaryButton>
                );
              }

              return (
                <button
                  onClick={openConnectModal}
                  className="tracking-wider text-primaryLight font-semibold"
                >
                  CONNECTED TO {account.displayName.toUpperCase()}
                </button>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

type Action = {
  wagmiPrep: {
    address: Address;
    abi: readonly unknown[];
    functionName: string;
    args: readonly unknown[];
  };
};

async function getNoteSignature(
  linkType: "note" | "notev2",
  sender: Address,
  recipient: Address,
  urlHash: string
) {
  if (linkType === "note") {
    // Deprecated notes link
    return getNoteClaimSignature(sender, recipient, urlHash as Hex);
  } else {
    return getNoteClaimSignatureFromSeed(sender, recipient, urlHash);
  }
}

async function linkStatusToAction(
  linkStatus: DaimoLinkStatus,
  selfAddress: Address,
  urlHash: string
): Promise<Action> {
  switch (linkStatus.link.type) {
    case "request": {
      const { recipient } = linkStatus as DaimoRequestStatus;
      const parsedAmount = parseUnits(
        linkStatus.link.dollars,
        chainConfig.tokenDecimals
      );
      return {
        wagmiPrep: {
          address: chainConfig.tokenAddress,
          abi: erc20ABI as readonly unknown[],
          functionName: "transfer" as const,
          args: [recipient.addr, parsedAmount] as const,
        },
      };
    }
    case "note":
    case "notev2": {
      const { sender, contractAddress, ephemeralOwner } =
        linkStatus as DaimoNoteStatus;

      const signature = await getNoteSignature(
        linkStatus.link.type,
        sender.addr,
        selfAddress,
        urlHash
      );

      if (contractAddress === daimoEphemeralNotesV2Address) {
        assert(
          selfAddress !== sender.addr,
          "sender shouldn't be claiming their own note on web"
        );
        return {
          wagmiPrep: {
            ...daimoEphemeralNotesV2Config,
            functionName: "claimNoteRecipient" as const,
            args: [ephemeralOwner, selfAddress, signature] as const,
          },
        };
      } else {
        return {
          wagmiPrep: {
            ...daimoEphemeralNotesConfig,
            functionName: "claimNote" as const,
            args: [ephemeralOwner, signature] as const,
          },
        };
      }
    }
    default: {
      throw new Error(
        `unexpected DaimoLinkStatus ${linkStatus.link.type} for wallet action`
      );
    }
  }
}
