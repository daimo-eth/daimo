"use client";

import {
  AuthKitProvider,
  SignInButton,
  StatusAPIResponse,
} from "@farcaster/auth-kit";
import { useState } from "react";

import { Spacer } from "./layout";

const config = {
  domain: "daimo.com",
  siweUri: "https://daimo.com/connect/farcaster",
  rpcUrl: "https://mainnet.optimism.io",
  relay: "https://relay.farcaster.xyz",
};

export function ConnectFarcasterBox() {
  const [profile, setProfile] = useState<StatusAPIResponse | undefined>();

  return (
    <AuthKitProvider config={config}>
      <SignInButton onSuccess={setProfile} />
      <Spacer h={8} />
      <pre>{profile && JSON.stringify(profile, null, 2)}</pre>
    </AuthKitProvider>
  );
}
