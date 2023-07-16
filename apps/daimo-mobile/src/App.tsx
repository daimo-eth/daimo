import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { Text } from "react-native";

import { ChainContext } from "./logic/chain";
import { useInitNotifications } from "./logic/notify";
import { RpcProvider } from "./logic/trpc";
import { usePollChain, useSyncAccountHistory } from "./sync/sync";
import { HomeStackNav } from "./view/HomeStack";
import { useHandleNavLinks } from "./view/shared/nav";

export default function App() {
  console.log("[APP] rendering");

  // Display notifications, listen for push notifications
  useInitNotifications();

  // Start polling chain status - L1 tip, L2 tip, account balance, transfers
  const chainState = usePollChain();

  // Sync account history
  // TODO: combine with usePollChain into a unified sync
  useSyncAccountHistory();

  return (
    <RpcProvider>
      <NavigationContainer fallback={<Text>Loading...</Text>}>
        <ChainContext.Provider value={chainState}>
          <AppBody />
        </ChainContext.Provider>
      </NavigationContainer>
    </RpcProvider>
  );
}

function AppBody() {
  // Handle incoming applinks
  useHandleNavLinks();

  return (
    <>
      <HomeStackNav />
      <StatusBar style="auto" />
    </>
  );
}
