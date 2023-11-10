"use client";

import {
  RainbowKitProvider,
  connectorsForWallets,
  getDefaultWallets,
} from "@rainbow-me/rainbowkit";
import * as React from "react";
import { useMemo } from "react";
import { Chain, arbitrum, base, mainnet, optimism, polygon } from "viem/chains";
import { WagmiConfig, configureChains, createConfig } from "wagmi";
import { publicProvider } from "wagmi/providers/public";

import { chainConfig } from "../env";

export const chainsDaimoL2 = [chainConfig.chainL2];

export const chainsBridge = [mainnet, base, optimism, arbitrum, polygon];

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
    const { publicClient, webSocketPublicClient } = configureChains(chains, [
      publicProvider(),
    ]);

    const walletConnectProjectId = "06d134eadbbacc1f9dd4575541dda90c";

    const { wallets } = getDefaultWallets({
      appName: "Daimo",
      projectId: walletConnectProjectId,
      chains,
    });

    const connectors = connectorsForWallets([...wallets]);

    return createConfig({
      autoConnect: true,
      connectors,
      publicClient,
      webSocketPublicClient,
    });
  }, [chains]);

  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains} appInfo={appInfo}>
        {mounted && children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
