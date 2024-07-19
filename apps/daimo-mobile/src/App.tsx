import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { getLocales } from "expo-localization";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Dispatcher, DispatcherContext } from "./action/dispatch";
import TypesafeI18n from "./i18n/i18n-react";
import { isLocale } from "./i18n/i18n-util";
import { useAccount } from "./logic/accountManager";
import { useInitNotifications } from "./logic/notify";
import { RpcProvider } from "./logic/trpc";
import { TabNav } from "./view/TabNav";
import { renderErrorFallback } from "./view/screen/errorScreens";
import { color } from "./view/shared/style";
import { GlobalBottomSheet } from "./view/sheet/GlobalBottomSheet";

// const DEFAULT_LOCALE =
//   getLocales()
//     .map((it) => it.languageTag)
//     .find(isLocale) ?? "en";

export default function App() {
  const account = useAccount();
  const onb = account?.isOnboarded ? "onboarded" : "not onboarded";
  console.log(`[APP] rendering ${account?.name || "no account"}, ${onb}`);

  // Display notifications, listen for push notifications
  useInitNotifications();

  // Load font to fix icons on Android
  useFonts({ Octicons: require("../assets/octicons.ttf") });

  // White background to avoid between-tab flicker
  let theme = DefaultTheme;
  theme = { ...theme, colors: { ...theme.colors, background: color.white } };
  // Global dispatcher
  const dispatcher = useMemo(() => new Dispatcher(), []);

  // Locale for i18n
  // const locale = useLocale();
  const locale = "en";

  return (
    <RpcProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer theme={theme}>
          <DispatcherContext.Provider value={dispatcher}>
            <TypesafeI18n locale={locale}>
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
