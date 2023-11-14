"use client";
import { assert } from "@daimo/common";
import Image from "next/image";
import { useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useZupass, ZupassProvider } from "zukit";

import { PrimaryOpenInAppButton } from "../../components/buttons";
import { RpcHookProvider, rpcHook } from "../../utils/rpcHook";

const domain = process.env.NEXT_PUBLIC_DOMAIN || process.env.DAIMO_DOMAIN;

const popupURL = domain
  ? `https://${domain}/waitlist/popup`
  : "http://localhost:3001/waitlist/popup";

export default function WaitlistPage() {
  return (
    <RpcHookProvider>
      <ZupassProvider popupURL={popupURL}>
        <WaitlistPageInner />
      </ZupassProvider>
    </RpcHookProvider>
  );
}

function WaitlistPageInner() {
  const [zupass, zupassLogin] = useZupass();

  const inviteCode = rpcHook.trpc.getZupassInviteCode.useQuery({
    pcd: zupass.status === "logged-in" ? zupass.serializedPCD.pcd : undefined,
  });

  const login = useCallback(async () => {
    zupassLogin({ type: "login", anonymous: false });
  }, [zupassLogin]);

  const primaryButtonStyle =
    "bg-primaryLight tracking-wider text-white font-bold py-5 w-full rounded-md disabled:opacity-50";

  const textElement = (() => {
    if (zupass.status === "logged-in") {
      if (inviteCode.isError) {
        return (
          <>
            <div className="text-xl font-semibold text-danger">
              Error: {inviteCode.error.message}
            </div>
            <div className="h-6" />
          </>
        );
      } else if (inviteCode.isLoading) {
        return (
          <>
            <div className="text-xl font-semibold text-grayMid">
              Loading invite code...
            </div>
            <div className="h-6" />
          </>
        );
      } else if (inviteCode.isSuccess && inviteCode.data) {
        return (
          <>
            <div className="text-xl font-semibold text-grayMid">
              Sign up for Daimo with invite code
            </div>
            <div className="h-6" />
            <div className="text-2xl font-mono text-success">
              {inviteCode.data}{" "}
              <InlineCopyButton inviteCode={inviteCode.data} />
            </div>
            <div className="h-6" />
          </>
        );
      }
    }
    return (
      <>
        <div className="text-xl font-semibold text-grayMid">
          Sign in with your Zupass ticket to get a Daimo invite code.
        </div>
        <div className="h-12" />
      </>
    );
  })();

  const zupassElement = (() => {
    switch (zupass.status) {
      case "logged-in": {
        assert(zupass.anonymous === false);
        return (
          <>
            <PrimaryOpenInAppButton />
            <div className="h-6" />
            <p className="tracking-wider text-primaryLight font-semibold uppercase">
              SIGNED IN AS {zupass.participant.email}
            </p>
          </>
        );
      }
      case "logging-in": {
        return (
          <button className={primaryButtonStyle} disabled>
            SIGNING IN
          </button>
        );
      }
      case "logged-out": {
        return (
          <button className={primaryButtonStyle} onClick={login}>
            SIGN IN WITH ZUPASS
          </button>
        );
      }
    }
  })();

  return (
    <main className="max-w-md mx-auto px-4">
      <center>
        <div className="h-16" />
        <Image src="/logo-devconnect.png" alt="Daimo" width="240" height="96" />
        <div className="h-12" />
        <div className="text-2xl font-semibold">Join Daimo @ Devconnect</div>
        <div className="h-6" />
        {textElement}
        {zupassElement}
        <Toaster position="top-center" />
      </center>
    </main>
  );
}

function InlineCopyButton({ inviteCode }: { inviteCode: string }) {
  const copyInviteCodeToClipboard = () => {
    console.log("copying inviteCode to clipboard");
    navigator.clipboard.writeText(inviteCode);
    toast.success("Copied!");
  };

  return (
    <button type="button" onClick={copyInviteCodeToClipboard}>
      <div>
        <svg
          className="w-5 h-5"
          fill="none"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
          color="#009900"
        >
          <path
            stroke="#009900"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.4 20H9.6a.6.6 0 0 1-.6-.6V9.6a.6.6 0 0 1 .6-.6h9.8a.6.6 0 0 1 .6.6v9.8a.6.6 0 0 1-.6.6Z"
          ></path>
          <path
            stroke="#009900"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 9V4.6a.6.6 0 0 0-.6-.6H4.6a.6.6 0 0 0-.6.6v9.8a.6.6 0 0 0 .6.6H9"
          ></path>
        </svg>
        <span className="sr-only">Copy</span>
      </div>
    </button>
  );
}
