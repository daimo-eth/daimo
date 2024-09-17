import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Dispatcher, DispatcherContext } from "./action/dispatch";
import { useAccount } from "./logic/accountManager";
import { useInitNotifications } from "./logic/notify";
import { RpcProvider } from "./logic/trpc";
import { TabNav } from "./view/TabNav";
import { renderErrorFallback } from "./view/screen/errorScreens";
import { GlobalBottomSheet } from "./view/sheet/GlobalBottomSheet";
import { SkinContextType, skins } from "./view/style/skins";
import { ThemeContext, loadSavedTheme } from "./view/style/theme";

export default function App() {
  const account = useAccount();
  const onb = account?.isOnboarded ? "onboarded" : "not onboarded";
  console.log(`[APP] rendering ${account?.name || "no account"}, ${onb}`);

  // Display notifications, listen for push notifications
  useInitNotifications();

  // Load font to fix icons on Android
  useFonts({
    Octicons: require("../assets/octicons.ttf"),
  });

  // Skin theme
  const [theme, setTheme] = useState<SkinContextType>(skins.usdt);
  useEffect(() => {
    async function loadTheme() {
      const savedTheme = await loadSavedTheme();
      setTheme(savedTheme);
    }
    loadTheme();
  }, []);

  // Nav background to avoid between-tab flicker
  const navTheme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: theme.color.white },
  };

  // Global dispatcher
  const dispatcher = useMemo(() => new Dispatcher(), []);

  return (
    <RpcProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeContext.Provider value={{ theme, setTheme }}>
          <NavigationContainer theme={navTheme}>
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
        </ThemeContext.Provider>
      </GestureHandlerRootView>
    </RpcProvider>
  );
}
