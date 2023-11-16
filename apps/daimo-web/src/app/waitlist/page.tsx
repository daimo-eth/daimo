"use client";
import { assert, daimoDomain } from "@daimo/common";
import Image from "next/image";
import { useCallback, useState } from "react";
import { ZupassProvider, useZupass } from "zukit";

import { PrimaryOpenInAppButton } from "../../components/buttons";
import { RpcHookProvider, rpcHook } from "../../utils/rpcHook";

const popupURL = daimoDomain
  ? `https://${daimoDomain}/waitlist/popup`
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
  const [zupass, zupassReq] = useZupass();

  const inviteCode = rpcHook.trpc.getZupassInviteCode.useQuery({
    pcd: zupass.status === "logged-in" ? zupass.serializedPCD.pcd : undefined,
  });

  const login = useCallback(async () => {
    zupassReq({ type: "login", anonymous: false });
  }, [zupassReq]);

  const logout = useCallback(async () => {
    zupassReq({ type: "logout" });
  }, [zupassReq]);

  const primaryButtonStyle =
    "bg-primaryLight tracking-wider text-white font-bold py-5 w-full rounded-md disabled:opacity-50";

  const textElement = (() => {
    if (zupass.status === "logged-in") {
      if (inviteCode.isError) {
        return (
          <>
            <div className="text-lg font-semibold text-danger">
              Error: {inviteCode.error.message}
            </div>
            <div className="h-6" />
          </>
        );
      } else if (inviteCode.isLoading) {
        return (
          <>
            <div className="text-lg font-semibold text-grayMid">
              Loading invite code...
            </div>
            <div className="h-6" />
          </>
        );
      } else if (inviteCode.isSuccess && inviteCode.data) {
        return (
          <>
            <div className="text-lg font-semibold text-grayMid">
              You&apos;re in. Here&apos;s your invite code:
            </div>
            <InlineCopyButton inviteCode={inviteCode.data} />
            <div className="h-4" />
          </>
        );
      }
    }
    return (
      <>
        <div className="text-lg font-semibold text-midnight">
          Sign in with Zupass to get an invite code.
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
            <div className="h-4" />
            <p className="text-lg font-semibold text-midnight">
              Signed in as {zupass.participant.email} ·{" "}
              <a href="#" className="text-primary" onClick={logout}>
                Sign out
              </a>
            </p>
          </>
        );
      }
      case "logging-in": {
        return (
          <button className={primaryButtonStyle} disabled>
            SIGNING IN...
          </button>
        );
      }
      case "logged-out": {
        return (
          <>
            <button className={primaryButtonStyle} onClick={login}>
              SIGN IN WITH ZUPASS
            </button>
            <div className="h-4" />
            <div className="text-lg font-semibold text-grayMid">
              Not at Devconnect? Sign up for the{" "}
              <a
                className="text-primaryLight"
                href="https://noteforms.com/forms/daimo-uk2fe4"
                target="_blank"
              >
                waitlist
              </a>
              .
            </div>
          </>
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
        <div className="text-2xl font-semibold">Devconnect Early Access</div>
        <div className="h-8" />
        <div className="text-lg text-grayMid font-semibold">
          Daimo is an open source, self-custody payments app that runs on
          Ethereum.{" "}
          <a
            className="text-primaryLight"
            href="https://daimo.com"
            target="_blank"
          >
            Learn more here.
          </a>
        </div>
        <div className="h-6" />
        {textElement}
        {zupassElement}
      </center>
    </main>
  );
}

function InlineCopyButton({ inviteCode }: { inviteCode: string }) {
  const [justCopied, setJustCopied] = useState(false);

  const copyInviteCodeToClipboard = () => {
    console.log("copying inviteCode to clipboard");
    navigator.clipboard.writeText(inviteCode);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 1000);
  };

  return (
    <>
      <button
        type="button"
        onClick={copyInviteCodeToClipboard}
        className="flex flex-row gap-3 items-center leading-none px-6 py-4 rounded-lg relative hover:bg-ivory"
      >
        <div className="text-2xl font-mono font-bold">{inviteCode}</div>
        <div>
          <svg
            className="w-5 h-5"
            fill="none"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
            color="#000"
          >
            <path
              stroke="#000"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.4 20H9.6a.6.6 0 0 1-.6-.6V9.6a.6.6 0 0 1 .6-.6h9.8a.6.6 0 0 1 .6.6v9.8a.6.6 0 0 1-.6.6Z"
            ></path>
            <path
              stroke="#000"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 9V4.6a.6.6 0 0 0-.6-.6H4.6a.6.6 0 0 0-.6.6v9.8a.6.6 0 0 0 .6.6H9"
            ></path>
          </svg>
        </div>
      </button>
      <div className="text-grayMid text-lg font-semibold">
        {justCopied ? "Copied" : <>&nbsp;</>}
      </div>
    </>
  );
}
