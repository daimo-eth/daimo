"use client";

import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import * as React from "react";
import { useMemo } from "react";
import { WagmiProvider } from "wagmi";
import { Chain } from "wagmi/chains";

import { chainConfig } from "../env";

export const chainsDaimoL2 = [chainConfig.chainL2] as [Chain, ...Chain[]];

const appInfo = {
  appName: "Daimo",
  learnMoreUrl: "https://daimo.com",
};

export function Providers({
  chains,
  children,
}: {
  chains: [Chain, ...Chain[]];
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const wagmiConfig = useMemo(() => {
    const walletConnectProjectId = "06d134eadbbacc1f9dd4575541dda90c";

    return getDefaultConfig({
      appName: "Daimo",
      projectId: walletConnectProjectId,
      chains,
    });
  }, [chains]);

  return (
    <WagmiProvider config={wagmiConfig}>
      <RainbowKitProvider appInfo={appInfo}>
        {mounted && children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
}
