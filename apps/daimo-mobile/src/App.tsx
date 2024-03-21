import { now } from "@daimo/common";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { BottomSheetDefaultBackdropProps } from "@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Keyboard, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RNShake from "react-native-shake";

import { Action, Dispatcher, DispatcherContext } from "./action/dispatch";
import { useAccount } from "./logic/accountManager";
import { useInitNotifications } from "./logic/notify";
import { RpcProvider } from "./logic/trpc";
import { TabNav } from "./view/TabNav";
import { renderErrorFallback } from "./view/screen/errorScreens";
import ScrollPellet from "./view/shared/ScrollPellet";
import { color } from "./view/shared/style";
import { DebugBottomSheet } from "./view/sheet/DebugBottomSheet";
import { FarcasterBottomSheet } from "./view/sheet/FarcasterBottomSheet";
import { HelpBottomSheet } from "./view/sheet/HelpBottomSheet";

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

  useEffect(() => {
    const nowS = now();
    if (account == null || nowS - account.lastBlockTimestamp < 60 * 10) {
      SplashScreen.hideAsync();
    }
  }, []);

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

const bottomSheetSettings = {
  debug: {
    snapPoints: ["33%"],
    enableSwipeClose: true,
  },
  connectFarcaster: {
    snapPoints: ["66%"],
    enableSwipeClose: true,
  },
  linkFarcaster: {
    snapPoints: ["66%"],
    enableSwipeClose: false,
  },
  helpModal: {
    snapPoints: [],
    enableSwipeClose: true,
  },
} as const;
const defaultSnapPoints = ["10%"];

type GlobalBottomSheet = null | keyof typeof bottomSheetSettings;

function AppBody() {
  // Global dispatcher
  const dispatcher = useMemo(() => new Dispatcher(), []);

  // Global bottom sheet
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [bottomSheet, setBottomSheet] = useState<GlobalBottomSheet>(null);
  const [bottomSheetAction, setBottomSheetAction] = useState<
    { title: string; content: ReactElement } | undefined
  >();
  const settings = bottomSheet && bottomSheetSettings[bottomSheet];
  const snapPoints = settings?.snapPoints || defaultSnapPoints;
  const enableSwipeClose = settings?.enableSwipeClose || false;

  // Global shake gesture > open Send Debug Log sheet
  useEffect(() => {
    const subscription = RNShake.addListener(() => {
      Keyboard.dismiss();
      setBottomSheet("debug");
    });
    return () => subscription.remove();
  }, []);

  // Open bottom sheet when requested
  useEffect(() => {
    console.log(`[APP] bottomSheet=${bottomSheet}`);
    if (bottomSheet) bottomSheetRef.current?.expand();
    else bottomSheetRef.current?.close();
  }, [bottomSheet]);

  // Close bottom sheet when user swipes it away
  const onChangeIndex = useCallback((index: number) => {
    if (index < 0) setBottomSheet(null);
  }, []);

  const onClose = useCallback(() => {
    setBottomSheet(null);
  }, []);

  // Dark backdrop for bottom sheet
  const renderBackdrop = useCallback(
    (props: BottomSheetDefaultBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-0.9}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    []
  );

  // Handle dispatch > open bottom sheet
  const openFC = () => setBottomSheet("connectFarcaster");
  const linkFC = () => setBottomSheet("linkFarcaster");
  useEffect(() => dispatcher.register("connectFarcaster", openFC), []);
  useEffect(() => dispatcher.register("linkFarcaster", linkFC), []);
  const hideSheet = () => setBottomSheet(null);
  useEffect(() => dispatcher.register("hideBottomSheet", hideSheet), []);

  const openHelp = (helpAction: Action) => {
    setBottomSheet("helpModal");
    if (helpAction.name === "helpModal") {
      setBottomSheetAction(helpAction);
    }
  };
  useEffect(() => dispatcher.register("helpModal", openHelp), []);

  return (
    <DispatcherContext.Provider value={dispatcher}>
      <ErrorBoundary fallbackRender={renderErrorFallback}>
        <SafeAreaProvider>
          <TabNav />
          <StatusBar style="auto" />
          <View
            style={styles.bottomSheetWrapper}
            pointerEvents={bottomSheet != null ? "auto" : "none"}
          >
            <BottomSheet
              handleComponent={ScrollPellet}
              backdropComponent={renderBackdrop}
              ref={bottomSheetRef}
              index={-1}
              snapPoints={snapPoints}
              onChange={onChangeIndex}
              onClose={onClose}
              enablePanDownToClose={enableSwipeClose}
              enableDynamicSizing={bottomSheet === "helpModal"}
            >
              {bottomSheet === "debug" && <DebugBottomSheet />}
              {(bottomSheet === "connectFarcaster" ||
                bottomSheet === "linkFarcaster") && <FarcasterBottomSheet />}
              {bottomSheet === "helpModal" && bottomSheetAction && (
                <BottomSheetView>
                  <HelpBottomSheet
                    content={bottomSheetAction.content}
                    title={bottomSheetAction.title}
                    onPress={() => bottomSheetRef.current?.close()}
                  />
                </BottomSheetView>
              )}
            </BottomSheet>
          </View>
        </SafeAreaProvider>
      </ErrorBoundary>
    </DispatcherContext.Provider>
  );
}

const styles = StyleSheet.create({
  bottomSheetWrapper: {
    position: "absolute",
    height: "100%",
    width: "100%",
    alignItems: "center",
  },
});
