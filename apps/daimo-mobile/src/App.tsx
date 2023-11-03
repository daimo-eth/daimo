import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useInitNotifications } from "./logic/notify";
import { RpcProvider } from "./logic/trpc";
import { useSyncChain } from "./sync/sync";
import { TabNav } from "./view/TabNav";
import { useInitNavLinks } from "./view/shared/nav";
import { color } from "./view/shared/style";

export default function App() {
  console.log("[APP] rendering");

  // Display notifications, listen for push notifications
  useInitNotifications();

  // Sync data from chain. Account balance, transfers, ...
  useSyncChain();

  // Load font to fix icons on Android
  useFonts({ Octicons: require("../assets/octicons.ttf") });

  // White background to avoid between-tab flicker
  let theme = DefaultTheme;
  theme = { ...theme, colors: { ...theme.colors, background: color.white } };

  return (
    <RpcProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer theme={theme}>
          <AppBody />
        </NavigationContainer>
      </GestureHandlerRootView>
    </RpcProvider>
  );
}

function AppBody() {
  // Handle incoming applinks
  useInitNavLinks();

  return (
    <SafeAreaProvider>
      <TabNav />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
