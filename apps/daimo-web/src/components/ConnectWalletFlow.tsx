import {
  DaimoLinkStatus,
  DaimoNoteStatus,
  DaimoRequestState,
  DaimoRequestStatus,
  DaimoRequestV2Status,
  assert,
  assertNotNull,
  decodeRequestIdString,
  getNoteClaimSignature,
  getNoteClaimSignatureFromSeed,
} from "@daimo/common";
import {
  daimoRequestAddress,
  daimoRequestABI,
  daimoEphemeralNotesV2ABI,
  notesV2AddressMap,
  daimoEphemeralNotesABI,
  notesV1AddressMap,
} from "@daimo/contract";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useMemo, useEffect, useState } from "react";
import { Address, Hex, InsufficientFundsError, parseUnits } from "viem";
import {
  useNetwork,
  usePrepareContractWrite,
  useContractWrite,
  useAccount,
  erc20ABI,
} from "wagmi";

import { SecondaryButton, TextButton } from "./buttons";
import { chainConfig } from "../env";

export function ConnectWalletFlow({
  linkStatus,
  description,
  setSecondary,
}: {
  linkStatus: DaimoLinkStatus;
  description: string;
  setSecondary: () => void;
}) {
  const { address, isConnected } = useAccount();
  const [creationError, setCreationError] = useState<string>();

  const [action, setAction] = useState<WagmiPrep[]>();
  const [currentStep, setCurrentStep] = useState(0);

  const descriptionVerb = description.split(" ")[0].toUpperCase();
  const secondaryTitle = descriptionVerb + " WITH CONNECTED WALLET";
  const secondaryConnectTitle = descriptionVerb + " WITH ANOTHER WALLET";

  useEffect(() => {
    (async () => {
      try {
        if (!address) return;

        // URL hash part is not readable server side.
        const hash = window.location.hash.slice(1);

        const action = await linkStatusToAction(linkStatus, address, hash);
        console.log("action", action);
        setAction(action);
      } catch (e: any) {
        setCreationError(e.message);
      }
    })();
  }, [linkStatus, address]);

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
  const { chain } = useNetwork();
  const { config, error } = usePrepareContractWrite(wagmiPrep);
  const { data, isLoading, isSuccess, write } = useContractWrite(config);

  const humanReadableError = useMemo(() => {
    if (!error || !error.message) return undefined;
    if (error.message.match(/ERC20: transfer amount exceeds balance/)) {
      return "Not enough USDC in wallet";
    } else if (error.message.match(/note does not exist/)) {
      return "Already claimed"; // Only shown on out of date page load
    } else if (error.message.match(/already fulfilled or cancelled/)) {
      return "Request already fulfilled or cancelled"; // Only shown on out of date page load
    } else if (error instanceof InsufficientFundsError) {
      return "Insufficient ETH for transaction gas";
    } else {
      return error.message;
    }
  }, [error]);

  useEffect(() => {
    if (isSuccess && incrementStep) incrementStep();
  }, [isSuccess, incrementStep]);

  useEffect(() => {
    if (isLoading || isSuccess) setSecondary();
  }, [isLoading, isSuccess, setSecondary]);

  return (
    <>
      {humanReadableError === undefined && (
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
              : isSuccess && !incrementStep
              ? "VIEW ON BLOCK EXPLORER"
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
                    WRONG NETWORK
                  </TextButton>
                );
              }

              return (
                <TextButton onClick={openConnectModal}>
                  CONNECTED TO {account.displayName.toUpperCase()}
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
  urlHash: string
): Promise<WagmiPrep[]> {
  const chainId = chainConfig.chainL2.id;

  switch (linkStatus.link.type) {
    case "request": {
      const { recipient, fulfilledBy } = linkStatus as DaimoRequestStatus;
      const parsedAmount = parseUnits(
        linkStatus.link.dollars,
        chainConfig.tokenDecimals
      );
      if (fulfilledBy != null) {
        return [];
      }
      return [
        {
          address: chainConfig.tokenAddress,
          abi: erc20ABI as readonly unknown[],
          functionName: "transfer" as const,
          args: [recipient.addr, parsedAmount] as const,
        },
      ];
    }
    case "requestv2": {
      const { link, status } = linkStatus as DaimoRequestV2Status;
      if (status !== DaimoRequestState.Created) return [];

      const id = decodeRequestIdString(link.id);
      const parsedAmount = parseUnits(
        linkStatus.link.dollars,
        chainConfig.tokenDecimals
      );
      return [
        {
          address: chainConfig.tokenAddress,
          abi: erc20ABI as readonly unknown[],
          functionName: "approve" as const,
          args: [daimoRequestAddress, parsedAmount] as const,
        },
        {
          address: daimoRequestAddress,
          abi: daimoRequestABI,
          functionName: "fulfillRequest" as const,
          args: [id] as const,
        },
      ];
    }
    case "note":
    case "notev2": {
      const { sender, ephemeralOwner, claimer } = linkStatus as DaimoNoteStatus;

      if (claimer != null) return [];

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
            abi: daimoEphemeralNotesV2ABI,
            address: assertNotNull(notesV2AddressMap.get(chainId)),
            functionName: "claimNoteRecipient" as const,
            args: [ephemeralOwner, selfAddress, signature] as const,
          },
        ];
      } else {
        return [
          {
            abi: daimoEphemeralNotesABI,
            address: assertNotNull(notesV1AddressMap.get(chainId)),
            functionName: "claimNote" as const,
            args: [ephemeralOwner, signature] as const,
          },
        ];
      }
    }
    default: {
      throw new Error(
        `unexpected DaimoLinkStatus ${linkStatus.link.type} for wallet action`
      );
    }
  }
}
