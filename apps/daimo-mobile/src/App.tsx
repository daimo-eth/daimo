import { now } from "@daimo/common";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Dispatcher, DispatcherContext } from "./action/dispatch";
import { useAccount } from "./logic/accountManager";
import { useInitNotifications } from "./logic/notify";
import { RpcProvider } from "./logic/trpc";
import { TabNav } from "./view/TabNav";
import { renderErrorFallback } from "./view/screen/errorScreens";
import { color } from "./view/shared/style";
import { GlobalBottomSheet } from "./view/sheet/GlobalBottomSheet";

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [account] = useAccount();
  const onb = account?.isOnboarded ? "onboarded" : "not onboarded";
  console.log(`[APP] rendering ${account?.name || "no account"}, ${onb}`);

  // Display notifications, listen for push notifications
  useInitNotifications();

  // Load font to fix icons on Android
  useFonts({ Octicons: require("../assets/octicons.ttf") });

  // White background to avoid between-tab flicker
  let theme = DefaultTheme;
  theme = { ...theme, colors: { ...theme.colors, background: color.white } };

  // Remove splash screen
  useEffect(() => {
    const nowS = now();
    if (account == null || nowS - account.lastBlockTimestamp < 60 * 10) {
      console.log(`[APP] removing splash now, first render`);
      SplashScreen.hideAsync();
    } else {
      console.log(`[APP] removing splash after sync or 2s, whichever is first`);
      setTimeout(() => SplashScreen.hideAsync(), 2000);
    }
  }, []);

  // Global dispatcher
  const dispatcher = useMemo(() => new Dispatcher(), []);

  return (
    <RpcProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer theme={theme}>
          <DispatcherContext.Provider value={dispatcher}>
            <ErrorBoundary fallbackRender={renderErrorFallback}>
              <SafeAreaProvider>
                <TabNav />
                <StatusBar style="auto" />
                <GlobalBottomSheet />
              </SafeAreaProvider>
            </ErrorBoundary>
          </DispatcherContext.Provider>
        </NavigationContainer>
      </GestureHandlerRootView>
    </RpcProvider>
  );
}
