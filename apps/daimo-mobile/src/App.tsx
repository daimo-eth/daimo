import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useInitNotifications } from "./logic/notify";
import { RpcProvider } from "./logic/trpc";
import { useSyncChain } from "./sync/sync";
import { HomeStackNav } from "./view/HomeStack";
import { useNameCache } from "./view/shared/addr";
import { useInitNavLinks } from "./view/shared/nav";

export default function App() {
  console.log("[APP] rendering");

  // Display notifications, listen for push notifications
  useInitNotifications();

  // Sync data from chain. Account balance, transfers, ...
  useSyncChain();

  // Track names for known addresses
  useNameCache();

  return (
    <GestureHandlerRootView style={useRef({ flex: 1 }).current}>
      <RpcProvider>
        <NavigationContainer>
          <AppBody />
        </NavigationContainer>
      </RpcProvider>
    </GestureHandlerRootView>
  );
}

function AppBody() {
  // Handle incoming applinks
  useInitNavLinks();

  return (
    <>
      <HomeStackNav />
      <StatusBar style="auto" />
    </>
  );
}
