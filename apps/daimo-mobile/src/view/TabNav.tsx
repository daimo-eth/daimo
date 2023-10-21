import { assertUnreachable } from "@daimo/common";
import { chainConfig } from "@daimo/contract";
import Octicons from "@expo/vector-icons/Octicons";
import {
  BottomTabNavigationOptions,
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import { RouteProp } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, TouchableHighlight, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AddDeviceScreen } from "./screen/AddDeviceScreen";
import { DeviceScreen } from "./screen/DeviceScreen";
import { HistoryOpScreen } from "./screen/HistoryOpScreen";
import { HistoryScreen } from "./screen/HistoryScreen";
import HomeScreen from "./screen/HomeScreen";
import OnboardingScreen from "./screen/OnboardingScreen";
import { SettingsScreen } from "./screen/SettingsScreen";
import NoteScreen from "./screen/link/NoteScreen";
import CreateRequestScreen from "./screen/receive/CreateRequestScreen";
import DepositScreen from "./screen/receive/DepositScreen";
import SendRequestScreen from "./screen/receive/SendRequestScreen";
import SendScreen from "./screen/send/SendScreen";
import { OctName } from "./shared/InputBig";
import {
  ParamListHome,
  ParamListReceive,
  ParamListSend,
  ParamListSettings,
  ParamListTab,
  useNav,
} from "./shared/nav";
import { color, ss, touchHighlightUnderlay } from "./shared/style";
import { TextH3 } from "./shared/text";
import { useAccount } from "../model/account";

const Tab = createBottomTabNavigator<ParamListTab>();

export function TabNav() {
  const opts: BottomTabNavigationOptions = {
    unmountOnBlur: true,
    tabBarHideOnKeyboard: true,
  };
  return (
    <Tab.Navigator initialRouteName="HomeTab" screenOptions={getTabOptions}>
      <Tab.Screen name="HomeTab" component={HomeTab} options={opts} />
      <Tab.Screen name="DepositTab" component={DepositTab} options={opts} />
      <Tab.Screen name="ReceiveTab" component={ReceiveTab} options={opts} />
      <Tab.Screen name="SendTab" component={SendTab} options={opts} />
      <Tab.Screen name="SettingsTab" component={SettingsTab} options={opts} />
    </Tab.Navigator>
  );
}

function getTabOptions({
  route,
}: {
  route: RouteProp<ParamListTab, keyof ParamListTab>;
}): BottomTabNavigationOptions {
  const all: BottomTabNavigationOptions = {
    headerShown: false,
    tabBarStyle: {
      height: 80,
      paddingHorizontal: 16,
    },
    tabBarItemStyle: {
      paddingTop: 16,
      height: 76,
      paddingBottom: 16,
    },
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: "600",
    },
  };
  const head = { ...all, headerShown: true };
  switch (route.name) {
    case "DepositTab":
      return { title: "Deposit", tabBarIcon: getIcon("plus-circle"), ...head };
    case "ReceiveTab":
      return { title: "Receive", tabBarIcon: getIcon("download"), ...head };
    case "HomeTab":
      return { title: "Home", tabBarIcon: getIcon("home"), ...all };
    case "SendTab":
      return { title: "Send", tabBarIcon: getIcon("paper-airplane"), ...all };
    case "SettingsTab":
      return { title: "Settings", tabBarIcon: getIcon("gear"), ...all };
    default:
      assertUnreachable(route.name);
  }
}

function getIcon(name: OctName, focusName?: OctName) {
  return ({ focused }: { focused: boolean }) => (
    <Octicons
      size={24}
      name={focused ? name : focusName || name}
      color={focused ? color.primary : color.grayMid}
    />
  );
}

function DepositTab() {
  return <DepositScreen />;
}

const SendStack = createNativeStackNavigator<ParamListSend>();

function SendTab() {
  return (
    <SendStack.Navigator
      initialRouteName="Send"
      screenOptions={{ header: ScreenHeader }}
    >
      <SendStack.Group>
        <SendStack.Screen name="Send" component={SendScreen} />
      </SendStack.Group>
    </SendStack.Navigator>
  );
}

function ScreenHeader() {
  const nav = useNav();
  const showBack = nav.canGoBack();
  const goBack = useCallback(() => nav.goBack(), [nav]);
  const goHome = useCallback(
    () => nav.reset({ routes: [{ name: "HomeTab" }] }),
    [nav]
  );
  const state = nav.getState();
  const route = state.routes[state.index];

  const ins = useSafeAreaInsets();
  const style = useMemo(
    () => [styles.screenHead, { paddingTop: ins.top, height: 48 + ins.top }],
    [ins]
  );

  return (
    <View style={style}>
      <ScreenHeadButton icon="arrow-left" show={showBack} onPress={goBack} />
      <TextH3>{route.name}</TextH3>
      <ScreenHeadButton icon="x" show onPress={goHome} />
    </View>
  );
}

/** Shows a nav button if show===true, blank placeholder otherwise. */
function ScreenHeadButton({
  icon,
  show,
  onPress,
}: {
  icon: OctName;
  show: boolean;
  onPress: () => void;
}) {
  return (
    <View style={styles.screenHeadButtonWrap}>
      {show && (
        <TouchableHighlight
          onPress={onPress}
          style={styles.screenHeadButton}
          {...touchHighlightUnderlay.subtle}
        >
          <Octicons name={icon} size={24} color={color.midnight} />
        </TouchableHighlight>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenHead: {
    backgroundColor: color.white,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  screenHeadButtonWrap: {
    width: 48,
  },
  screenHeadButton: {
    width: 48,
    height: 48,
    borderRadius: 48,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});

const HomeStack = createNativeStackNavigator<ParamListHome>();

function HomeTab() {
  const noHead = useRef({ headerShown: false }).current;
  return (
    <HomeStack.Navigator initialRouteName="Home">
      <HomeStack.Group>
        <HomeStack.Screen name="Home" component={MainScreen} options={noHead} />
        <HomeStack.Screen name="History" component={HistoryScreen} />
      </HomeStack.Group>
      <HomeStack.Group screenOptions={{ presentation: "modal" }}>
        <HomeStack.Screen name="HistoryOp" component={HistoryOpScreen} />
      </HomeStack.Group>
    </HomeStack.Navigator>
  );
}

const ReceiveStack = createNativeStackNavigator<ParamListReceive>();

function ReceiveTab() {
  const noHead = useMemo(() => ({ headerShown: false }), []);
  return (
    <ReceiveStack.Navigator initialRouteName="Request">
      <ReceiveStack.Group>
        <ReceiveStack.Screen
          name="Request"
          component={CreateRequestScreen}
          options={noHead}
        />
      </ReceiveStack.Group>
      <ReceiveStack.Group screenOptions={{ presentation: "modal" }}>
        <ReceiveStack.Screen
          name="RequestSend"
          options={{ headerTitle: `Request ${chainConfig.tokenSymbol}` }}
          component={SendRequestScreen}
        />
        <ReceiveStack.Screen
          name="Note"
          options={{ headerTitle: "Payment Link" }}
          component={NoteScreen}
        />
      </ReceiveStack.Group>
    </ReceiveStack.Navigator>
  );
}

const SettingsStack = createNativeStackNavigator<ParamListSettings>();

function SettingsTab() {
  return (
    <SettingsStack.Navigator>
      <SettingsStack.Group>
        <SettingsStack.Screen name="Settings" component={SettingsScreen} />
      </SettingsStack.Group>
      <SettingsStack.Group screenOptions={{ presentation: "modal" }}>
        <SettingsStack.Screen
          name="AddDevice"
          component={AddDeviceScreen}
          options={{ title: "Add Device" }}
        />
        <SettingsStack.Screen name="Device" component={DeviceScreen} />
      </SettingsStack.Group>
    </SettingsStack.Navigator>
  );
}

function MainScreen() {
  const [account] = useAccount();
  const [isOnboarded, setIsOnboarded] = useState<boolean>(account != null);
  useEffect(() => {
    if (isOnboarded && account == null) setIsOnboarded(false);
  }, [isOnboarded, account]);
  const onOnboardingComplete = () => setIsOnboarded(true);

  if (isOnboarded) return <HomeScreen />;
  return <OnboardingScreen {...{ onOnboardingComplete }} />;
}
