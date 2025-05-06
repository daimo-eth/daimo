"use client";

import {
  DaimoLinkStatus,
  DaimoNoteStatus,
  DaimoRequestStatus,
  DaimoRequestV2Status,
  assert,
  assertNotNull,
  decodeRequestIdString,
  getNoteClaimSignature,
  getNoteClaimSignatureFromSeed,
} from "@daimo/common";
import {
  daimoEphemeralNotesAbi,
  daimoEphemeralNotesV2Abi,
  daimoRequestAbi,
  daimoRequestAddress,
  erc20Abi,
  notesV1AddressMap,
  notesV2AddressMap,
} from "@daimo/contract";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useMemo, useState } from "react";
import { Address, Hex, InsufficientFundsError, parseUnits } from "viem";
import { useAccount, useSimulateContract, useWriteContract } from "wagmi";

import { SecondaryButton, TextButton } from "./buttons";
import { chainConfig } from "../env";
import { useI18N } from "../i18n/context";
import { LangDef } from "../i18n/languages/en";

export function ConnectWalletFlow({
  linkStatus,
  description,
  setSecondary,
}: {
  linkStatus: DaimoLinkStatus;
  description: string;
  setSecondary: () => void;
}) {
  const i18n = useI18N();
  const i18 = i18n.components.connectWallet;

  const { address, isConnected } = useAccount();
  const [creationError, setCreationError] = useState<string>();

  const [action, setAction] = useState<WagmiPrep[]>();
  const [currentStep, setCurrentStep] = useState(0);

  const descriptionVerb = description.split(" ")[0].toUpperCase();
  const secondaryTitle = descriptionVerb + i18.withConnected();
  const secondaryConnectTitle = descriptionVerb + i18.withAnother();

  useEffect(() => {
    (async () => {
      try {
        if (!address) return;

        // URL hash part is not readable server side.
        const hash = window.location.hash.slice(1);

        const action = await linkStatusToAction(
          linkStatus,
          address,
          hash,
          i18n
        );
        console.log("action", action);
        setAction(action);
      } catch (e: any) {
        setCreationError(e.message);
      }
    })();
  }, [linkStatus, address, i18n]);

  const incrementStep = useMemo(() => {
    if (currentStep < (action?.length ?? 0) - 1)
      return () => setCurrentStep(currentStep + 1);
    else return undefined;
  }, [currentStep, action]);

  const buttons = (() => {
    if (action === undefined) return undefined;
    return action.map((wagmiPrep, i) => {
      return (
        <WagmiButton
          key={i}
          title={secondaryTitle}
          wagmiPrep={wagmiPrep}
          incrementStep={incrementStep}
          setSecondary={setSecondary}
        />
      );
    });
  })();

  return (
    <>
      {creationError !== undefined && (
        <>
          <SecondaryButton disabled buttonType="danger">
            {creationError.toUpperCase()}
          </SecondaryButton>
          <div className="h-4" />
        </>
      )}
      {isConnected && buttons ? (
        buttons[currentStep]
      ) : (
        <CustomConnectButton title={secondaryConnectTitle} />
      )}
    </>
  );
}

function WagmiButton({
  title,
  wagmiPrep,
  incrementStep,
  setSecondary,
}: {
  title: string;
  wagmiPrep: WagmiPrep;
  incrementStep?: () => void;
  setSecondary: () => void;
}) {
  const i18n = useI18N();
  const i18 = i18n.components.connectWallet;
  const { chain } = useAccount();
  const { data, error } = useSimulateContract(wagmiPrep);
  const {
    writeContract,
    isPending,
    isSuccess,
    data: txHash,
  } = useWriteContract();

  const humanReadableError = useMemo(() => {
    if (error == null) return undefined;

    console.warn("Connect wallet error", error);
    if (error.message.match(/ERC20: transfer amount exceeds balance/)) {
      return i18.errors.notEnoughFunds();
    } else if (error.message.match(/note does not exist/)) {
      return i18.errors.alreadyClaimed(); // Only shown on out of date page load
    } else if (error.message.match(/already fulfilled or cancelled/)) {
      return i18.errors.alreadyFulfilledOrCancelled(); // Only shown on out of date page load
    } else if (error instanceof InsufficientFundsError) {
      return i18.errors.insufficientEth();
    } else {
      return error.message || "Unknown error";
    }
  }, [error, i18]);

  useEffect(() => {
    if (isSuccess && incrementStep) incrementStep();
  }, [isSuccess, incrementStep]);

  useEffect(() => {
    if (isPending || isSuccess) setSecondary();
  }, [isPending, isSuccess, setSecondary]);

  return (
    <>
      {humanReadableError === undefined && (
        <>
          <SecondaryButton
            disabled={writeContract == null || isPending}
            onClick={() => {
              if (isSuccess && txHash != null)
                window.open(
                  chain?.blockExplorers!.default.url + "/tx/" + txHash,
                  "_blank"
                );
              else writeContract(data!.request);
            }}
            buttonType={isSuccess ? "success" : undefined}
          >
            {isPending
              ? i18.misc.sending()
              : isSuccess && !incrementStep
              ? i18.misc.viewInExplorer()
              : title}
          </SecondaryButton>
          <div className="h-4" />
        </>
      )}
      {humanReadableError !== undefined && (
        <>
          <SecondaryButton disabled buttonType="danger">
            {humanReadableError.toUpperCase()}
          </SecondaryButton>
          <div className="h-4" />
        </>
      )}
    </>
  );
}

function CustomConnectButton({ title }: { title: string }): JSX.Element {
  const i18n = useI18N();
  const i18 = i18n.components.connectWallet;
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
                  <TextButton onClick={openConnectModal}>{title}</TextButton>
                );
              }

              if (chain.unsupported) {
                return (
                  <TextButton onClick={openChainModal} buttonType="danger">
                    {i18.misc.wrongNetwork()}
                  </TextButton>
                );
              }

              return (
                <TextButton onClick={openConnectModal}>
                  {i18.misc.connectedTo(account.displayName.toUpperCase())}
                </TextButton>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

type WagmiPrep = {
  address: Address;
  abi: readonly unknown[];
  functionName: string;
  args: readonly unknown[];
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
  urlHash: string,
  i18n: LangDef
): Promise<WagmiPrep[]> {
  const chainId = chainConfig.chainL2.id;

  const i18 = i18n.components.connectWallet;

  switch (linkStatus.link.type) {
    case "request": {
      const { recipient } = linkStatus as DaimoRequestStatus;

      // Only support payment links with a dollar amount
      if (!linkStatus.link.dollars) {
        throw new Error("Payment links must have a dollar amount");
      }
      const parsedAmount = parseUnits(
        linkStatus.link.dollars,
        chainConfig.tokenDecimals
      );

      return [
        {
          address: chainConfig.tokenAddress,
          abi: erc20Abi as readonly unknown[],
          functionName: "transfer" as const,
          args: [recipient.addr, parsedAmount] as const,
        },
      ];
    }
    case "requestv2": {
      const id = decodeRequestIdString(
        (linkStatus as DaimoRequestV2Status).link.id
      );
      const parsedAmount = parseUnits(
        linkStatus.link.dollars,
        chainConfig.tokenDecimals
      );
      return [
        {
          address: chainConfig.tokenAddress,
          abi: erc20Abi as readonly unknown[],
          functionName: "approve" as const,
          args: [daimoRequestAddress, parsedAmount] as const,
        },
        {
          address: daimoRequestAddress,
          abi: daimoRequestAbi,
          functionName: "fulfillRequest" as const,
          args: [id] as const,
        },
      ];
    }
    case "note":
    case "notev2": {
      const { sender, ephemeralOwner } = linkStatus as DaimoNoteStatus;

      const signature = await getNoteSignature(
        linkStatus.link.type,
        sender.addr,
        selfAddress,
        urlHash
      );

      if (linkStatus.link.type === "notev2") {
        assert(
          selfAddress !== sender.addr,
          "sender shouldn't be claiming their own note on web"
        );
        return [
          {
            abi: daimoEphemeralNotesV2Abi,
            address: assertNotNull(notesV2AddressMap.get(chainId)),
            functionName: "claimNoteRecipient" as const,
            args: [ephemeralOwner, selfAddress, signature] as const,
          },
        ];
      } else {
        return [
          {
            abi: daimoEphemeralNotesAbi,
            address: assertNotNull(notesV1AddressMap.get(chainId)),
            functionName: "claimNote" as const,
            args: [ephemeralOwner, signature] as const,
          },
        ];
      }
    }
    default: {
      throw new Error(i18.errors.unexpected(linkStatus.link.type));
    }
  }
}
