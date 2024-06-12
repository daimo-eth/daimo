"use client";

import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import * as React from "react";
import { useMemo } from "react";
import { Chain } from "viem/chains";
import { WagmiProvider } from "wagmi";

import { chainConfig } from "../env";

export const chainsDaimoL2 = [chainConfig.chainL2];

const appInfo = {
  appName: "Daimo",
  learnMoreUrl: "https://daimo.com",
};

export function Providers({
  chains,
  children,
}: {
  chains: Chain[];
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const wagmiConfig = useMemo(() => {
    const config = getDefaultConfig({
      appName: "Daimo",
      projectId: "06d134eadbbacc1f9dd4575541dda90c",
      chains: [chains[0], ...chains],
    });

    return config;
  }, [chains]);

  return (
    <WagmiProvider config={wagmiConfig}>
      <RainbowKitProvider appInfo={appInfo}>
        {mounted && children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
}
