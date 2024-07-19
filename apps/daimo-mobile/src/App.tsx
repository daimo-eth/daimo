import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Dispatcher, DispatcherContext } from "./action/dispatch";
import TypesafeI18n from "./i18n/i18n-react";
import { loadAllLocales, loadLocale } from "./i18n/i18n-util.sync";
import { useAccount } from "./logic/accountManager";
import { useI18n, useLocale } from "./logic/i18n";
import { useInitNotifications } from "./logic/notify";
import { RpcProvider } from "./logic/trpc";
import { TabNav } from "./view/TabNav";
import { renderErrorFallback } from "./view/screen/errorScreens";
import { color } from "./view/shared/style";
import { GlobalBottomSheet } from "./view/sheet/GlobalBottomSheet";

export default function App() {
  const account = useAccount();
  const onb = account?.isOnboarded ? "onboarded" : "not onboarded";
  console.log(`[APP] rendering ${account?.name || "no account"}, ${onb}`);

  // Load Locales
  // const locale = useLocale();
  // const locale = "en";
  // loadAllLocales();
  const i18n = useI18n();

  // Display notifications, listen for push notifications
  useInitNotifications();

  // Load font to fix icons on Android
  useFonts({ Octicons: require("../assets/octicons.ttf") });

  // White background to avoid between-tab flicker
  let theme = DefaultTheme;
  theme = { ...theme, colors: { ...theme.colors, background: color.white } };
  // Global dispatcher
  const dispatcher = useMemo(() => new Dispatcher(), []);

  return (
    <RpcProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer theme={theme}>
          <DispatcherContext.Provider value={dispatcher}>
            <TypesafeI18n locale="en">
              <ErrorBoundary fallbackRender={renderErrorFallback}>
                <SafeAreaProvider>
                  <TabNav />
                  <StatusBar style="auto" />
                  <GlobalBottomSheet />
                </SafeAreaProvider>
              </ErrorBoundary>
            </TypesafeI18n>
          </DispatcherContext.Provider>
        </NavigationContainer>
      </GestureHandlerRootView>
    </RpcProvider>
  );
}
