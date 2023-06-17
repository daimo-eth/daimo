import { NavigationContainer } from "@react-navigation/native";
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { Text } from "react-native";
import PolyfillCrypto from "react-native-webview-crypto";

import { Chain, ChainContext, ChainStatus } from "./logic/chain";
import { useInitNotifications } from "./logic/notify";
import { RpcProvider } from "./logic/trpc";
import { useAccount } from "./model/account";
import { HomeStackNav } from "./view/HomeStack";

export default function App() {
  console.log("[APP] rendering");

  // Display notifications, listen for push notifications
  useInitNotifications();

  // Start polling chain status - L1 tip, L2 tip, account balance, transfers
  const chainState = usePollChain();

  // Set up link nav for incoming daimo:// deep links
  const linking = useMemo(() => ({ prefixes: [Linking.createURL("/")] }), []);

  return (
    <RpcProvider>
      <NavigationContainer linking={linking} fallback={<Text>Loading...</Text>}>
        <ChainContext.Provider value={chainState}>
          <PolyfillCrypto />
          <HomeStackNav />
          <StatusBar style="auto" />
        </ChainContext.Provider>
      </NavigationContainer>
    </RpcProvider>
  );
}

function usePollChain() {
  const [account, setAccount] = useAccount();
  const [status, setStatus] = useState<ChainStatus>({ status: "loading" });
  const chain = useMemo(() => new Chain(), []);

  const refreshAccount = async () => {
    try {
      console.log(`[APP] Loading chain status...`);
      const status = await chain.getStatus();
      setStatus(status);

      if (!account || status.status !== "ok") return;
      console.log(`[APP] Reloading account ${account.address}...`);
      setAccount(await chain.updateAccount(account, status));
    } catch (e) {
      console.error(e);
    }
  };

  // Refresh whenever the account changes, then periodically
  const address = account?.address;
  useEffect(() => {
    refreshAccount();
    const interval = setInterval(refreshAccount, 30000);
    return () => clearInterval(interval);
  }, [address]);

  // Listen for transfers
  useEffect(() => {
    if (!address) return undefined;
    return chain.subscribeTransfers(address);
  }, [address]);

  const cs = useMemo(() => ({ chain, status }), [chain, status]);
  return cs;
}
