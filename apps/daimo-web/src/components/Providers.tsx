"use client";

import {
  RainbowKitProvider,
  connectorsForWallets,
  getDefaultWallets,
} from "@rainbow-me/rainbowkit";
import { ConnectorsForWalletsParameters } from "@rainbow-me/rainbowkit/dist/wallets/connectorsForWallets";
import * as React from "react";
import { useMemo, useState } from "react";
import { Chain } from "viem/chains";
import { createConfig, WagmiProvider } from "wagmi";

import { chainConfig } from "../env";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const chainsDaimoL2 = [chainConfig.chainL2] as const;

const appInfo = {
  appName: "Daimo",
  learnMoreUrl: "https://daimo.com",
};

export function Providers({
  chains,
  children,
}: {
  chains: readonly [Chain, ...Chain[]];
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const wagmiConfig = useMemo(() => {
    const walletConnectParams: ConnectorsForWalletsParameters = {
      appName: "Daimo",
      projectId: "06d134eadbbacc1f9dd4575541dda90c",
    };
    const { wallets } = getDefaultWallets(walletConnectParams);
    const connectors = connectorsForWallets([...wallets], walletConnectParams);

    return createConfig({
      connectors,
      chains,
      transports: [],
    });
  }, [chains]);

  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider appInfo={appInfo}>
          {mounted && children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
