import { LinkingOptions, NavigationContainer } from "@react-navigation/native";
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import { Text } from "react-native";

import { ChainContext } from "./logic/chain";
import { useInitNotifications } from "./logic/notify";
import { RpcProvider } from "./logic/trpc";
import { usePollChain, useSyncAccountHistory } from "./sync/sync";
import { HomeStackNav } from "./view/HomeStack";
import { HomeStackParamList } from "./view/shared/nav";

const prefix = Linking.createURL("/");
const linking: LinkingOptions<HomeStackParamList> = {
  prefixes: [prefix],
  config: {
    screens: {
      Note: "note",
    },
  },
};

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
      <NavigationContainer linking={linking} fallback={<Text>Loading...</Text>}>
        <ChainContext.Provider value={chainState}>
          <HomeStackNav />
          <StatusBar style="auto" />
        </ChainContext.Provider>
      </NavigationContainer>
    </RpcProvider>
  );
}
