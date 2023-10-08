import { NavigationContainer } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useInitNotifications } from "./logic/notify";
import { RpcProvider } from "./logic/trpc";
import { useSyncChain } from "./sync/sync";
import { HomeStackNav } from "./view/HomeStack";
import { useInitNavLinks } from "./view/shared/nav";
import { useInitNFC } from "./logic/nfcListen";


export default function App() {
  console.log("[APP] rendering");

  // Display notifications, listen for push notifications
  useInitNotifications();

  // Sync data from chain. Account balance, transfers, ...
  useSyncChain();

  // Load font to fix icons on Android
  useFonts({ Octicons: require("../assets/octicons.ttf") });

  return (
    <RpcProvider>
      <NavigationContainer>
        <AppBody />
      </NavigationContainer>
    </RpcProvider>
  );
}

function AppBody() {
  // Handle incoming applinks
  useInitNavLinks();

  useInitNFC();

  return (
    <SafeAreaProvider>
      <HomeStackNav />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
