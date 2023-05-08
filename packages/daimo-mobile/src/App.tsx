import { NavigationContainer } from "@react-navigation/native";
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import "fast-text-encoding";
import { useEffect, useMemo, useState } from "react";
import { Text } from "react-native";

import { useAccount } from "./logic/account";
import { Chain, ChainContext, ChainStatus, ViemChain } from "./logic/chain";
import { HomeStackNav } from "./view/HomeStack";

export default function App() {
  const [account, setAccount] = useAccount();
  const [status, setStatus] = useState<ChainStatus>();
  const chain = useMemo<Chain>(() => new ViemChain(), []);

  const refreshAccount = async () => {
    try {
      console.log(`[APP] Loading chain status...`);
      const status = await chain.getStatus();
      setStatus(status);

      if (!account || status.status !== "ok") return;
      console.log(`[APP] Loading account ${account.address}...`);
      setAccount(await chain.getAccount(account.address, status));
    } catch (e) {
      console.error(e);
    }
  };

  // Refresh whenever the account changes, then periodically
  useEffect(() => {
    refreshAccount();
    // TODO: subscribe for instant update
    const interval = setInterval(refreshAccount, 30000);
    return () => clearInterval(interval);
  }, [account?.address]);

  const cs = useMemo(() => ({ chain, status }), [chain, status]);

  const linking = useMemo(() => ({ prefixes: [Linking.createURL("/")] }), []);

  return (
    <NavigationContainer linking={linking} fallback={<Text>Loading...</Text>}>
      <ChainContext.Provider value={cs}>
        <HomeStackNav />
        <StatusBar style="auto" />
      </ChainContext.Provider>
    </NavigationContainer>
  );
}
