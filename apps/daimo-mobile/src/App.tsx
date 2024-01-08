import BottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { BottomSheetDefaultBackdropProps } from "@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RNShake from "react-native-shake";

import { useSendDebugLog } from "./common/useSendDebugLog";
import { useInitNotifications } from "./logic/notify";
import { RpcProvider } from "./logic/trpc";
import { useAccount } from "./model/account";
import { TabNav } from "./view/TabNav";
import { ButtonMed } from "./view/shared/Button";
import ScrollPellet from "./view/shared/ScrollPellet";
import Spacer from "./view/shared/Spacer";
import { color } from "./view/shared/style";
import { TextH3, TextLight } from "./view/shared/text";

SplashScreen.preventAutoHideAsync();

export default function App() {
  console.log("[APP] rendering");
  const [account] = useAccount();

  // Display notifications, listen for push notifications
  useInitNotifications();

  // Load font to fix icons on Android
  useFonts({ Octicons: require("../assets/octicons.ttf") });

  // White background to avoid between-tab flicker
  let theme = DefaultTheme;
  theme = { ...theme, colors: { ...theme.colors, background: color.white } };

  useEffect(() => {
    if (account == null) return;

    const nowS = Math.floor(Date.now() / 1000);
    if (nowS - account.lastBlockTimestamp < 60 * 10) {
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

function AppBody() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);

  const snapPoints = useMemo(() => ["33%"], []);

  useEffect(() => {
    const subscription = RNShake.addListener(() => {
      bottomSheetRef.current?.expand();
    });

    return () => {
      subscription.remove();
    };
  }, []);

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

  const onChangeIndex = (index: number) => setIsDebugModalOpen(index > -1);

  const [sendDL] = useSendDebugLog();

  return (
    <SafeAreaProvider>
      <TabNav />
      <StatusBar style="auto" />
      <View
        style={styles.bottomSheetWrapper}
        pointerEvents={isDebugModalOpen ? "auto" : "none"}
      >
        <BottomSheet
          handleComponent={ScrollPellet}
          backdropComponent={renderBackdrop}
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          onChange={onChangeIndex}
          enablePanDownToClose
        >
          <View style={styles.contentContainer}>
            <Spacer h={16} />
            <TextH3>Did something go wrong?</TextH3>
            <Spacer h={12} />
            <TextLight>Help us realize what's going wrong.</TextLight>
            <Spacer h={32} />
            <ButtonMed type="subtle" title="Send debug log" onPress={sendDL} />
          </View>
        </BottomSheet>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    alignSelf: "center",
    alignItems: "stretch",
  },
  bottomSheetWrapper: {
    position: "absolute",
    height: "100%",
    width: "100%",
  },
});
