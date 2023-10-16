"use client";
import {
  DaimoLinkStatus,
  DaimoNoteStatus,
  DaimoRequestStatus,
  getNoteClaimSignature,
} from "@daimo/common";
import { daimoEphemeralNotesConfig, chainConfig } from "@daimo/contract";
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

import { H2 } from "./typography";

type Action = {
  wagmiPrep: {
    address: Address;
    abi: readonly unknown[];
    functionName: string;
    args: readonly unknown[];
  };
  buttonTitle: string;
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
        buttonTitle: "Send via Wallet",
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
        buttonTitle: "Claim via Wallet",
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
}: {
  linkStatus: DaimoLinkStatus;
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

  return (
    <center>
      <H2>or</H2>
      <div className="h-4" />
      {isConnected && humanReadableError === undefined && (
        <>
          <button
            disabled={!write || isLoading || isSuccess}
            onClick={() => write?.()}
            className="inline-block rounded-lg py-2 px-4 bg-primaryLight text-white font-semibold md:text-xl tracking-wider hover:enabled:scale-105 transition-all"
          >
            {isLoading
              ? "Sending"
              : isSuccess
              ? "Successful"
              : action?.buttonTitle}
          </button>
          <div className="h-4" />
        </>
      )}
      {isConnected && humanReadableError !== undefined && (
        <>
          <p>{humanReadableError}</p>
          <div className="h-4" />
        </>
      )}
      {isSuccess && data?.hash && (
        <>
          <a
            href={chain?.blockExplorers!.default.url + "/tx/" + data?.hash}
            target="_blank"
            className="hover:underline"
          >
            Block explorer ↗
          </a>
          <div className="h-4" />
        </>
      )}
      <div className="flex justify-center">
        <ConnectButton />
      </div>
    </center>
  );
}
