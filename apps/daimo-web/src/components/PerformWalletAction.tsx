"use client";
import {
  DaimoLinkStatus,
  DaimoNoteStatus,
  DaimoRequestStatus,
  getNoteClaimSignature,
} from "@daimo/common";
import { daimoEphemeralNotesConfig } from "@daimo/contract";
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

import { PrimaryButton, SecondaryButton } from "./buttons";
import { chainConfig } from "../env";
import { detectPlatform, downloadMetadata } from "../utils/platform";

type Action = {
  wagmiPrep: {
    address: Address;
    abi: readonly unknown[];
    functionName: string;
    args: readonly unknown[];
  };
};

async function linkStatusToAction(
  linkStatus: DaimoLinkStatus,
  selfAddress: Address,
  ephPrivateKey: Hex | undefined
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
    case "note": {
      const { sender } = linkStatus as DaimoNoteStatus;
      const signature = await getNoteClaimSignature(
        sender.addr,
        selfAddress,
        ephPrivateKey
      );

      return {
        wagmiPrep: {
          ...daimoEphemeralNotesConfig,
          functionName: "claimNote" as const,
          args: [linkStatus.link.ephemeralOwner, signature] as const,
        },
      };
    }
    default: {
      throw new Error(
        `unexpected DaimoLinkStatus ${linkStatus.link.type} for wallet action`
      );
    }
  }
}

export function PerformWalletAction({
  linkStatus,
  description,
}: {
  linkStatus: DaimoLinkStatus;
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

    if (!error) return undefined;
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

        // Ephemeral private key is not readable server side.
        const ephPrivateKey = window.location.hash.slice(1) as Hex;

        const action = await linkStatusToAction(
          linkStatus,
          address,
          ephPrivateKey
        );
        setAction(action);
      } catch (e: any) {
        setCreationError(e.message);
      }
    })();
  }, [linkStatus, address]);

  const primaryTitle = description + " ON DAIMO";
  const secondaryTitle = description + " WITH CONNECTED WALLET";
  const secondaryConnectTitle = description + " WITH ANOTHER WALLET";

  return (
    <center>
      <PrimaryButton
        onClick={() => {
          const platform = detectPlatform(navigator.userAgent);
          if (platform === "other") window.open("/");
          else {
            window.open(downloadMetadata[platform].url, "_blank");
          }
        }}
        disabled={isLoading || isSuccess}
      >
        {primaryTitle}
      </PrimaryButton>
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
              ? "VIEW ON BASESCAN ↗"
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
                    Wrong network
                  </SecondaryButton>
                );
              }

              return (
                <p className="tracking-wider text-primaryLight font-semibold">
                  CONNECTED TO {account.displayName.toUpperCase()}
                </p>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
