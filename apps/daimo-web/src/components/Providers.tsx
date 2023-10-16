"use client";

import { chainConfig } from "@daimo/contract";
import {
  RainbowKitProvider,
  connectorsForWallets,
  getDefaultWallets,
} from "@rainbow-me/rainbowkit";
import * as React from "react";
import { WagmiConfig, configureChains, createConfig } from "wagmi";
import { publicProvider } from "wagmi/providers/public";

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [chainConfig.chainL2],
  [publicProvider()]
);

const walletConnectProjectId = "06d134eadbbacc1f9dd4575541dda90c";

const { wallets } = getDefaultWallets({
  appName: "Daimo",
  projectId: walletConnectProjectId,
  chains,
});

const demoAppInfo = {
  appName: "Daimo",
  learnMoreUrl: "https://daimo.xyz",
};

const connectors = connectorsForWallets([...wallets]);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains} appInfo={demoAppInfo}>
        {mounted && children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
