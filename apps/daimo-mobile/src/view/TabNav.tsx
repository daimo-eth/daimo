import { assertUnreachable } from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import {
  BottomTabNavigationOptions,
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import { RouteProp } from "@react-navigation/native";
import {
  NativeStackNavigationOptions,
  createNativeStackNavigator,
} from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { EdgeInsets, useSafeAreaInsets } from "react-native-safe-area-context";

import { AddDeviceScreen } from "./screen/AddDeviceScreen";
import { DeviceScreen } from "./screen/DeviceScreen";
import { HistoryOpScreen } from "./screen/HistoryOpScreen";
import HomeScreen from "./screen/HomeScreen";
import OnboardingScreen from "./screen/OnboardingScreen";
import { QRScreen } from "./screen/QRScreen";
import { SettingsScreen } from "./screen/SettingsScreen";
import NoteScreen from "./screen/link/NoteScreen";
import DepositScreen from "./screen/receive/DepositScreen";
import ReceiveScreen from "./screen/receive/ReceiveScreen";
import { SendNavScreen } from "./screen/send/SendNavScreen";
import SendTransferScreen from "./screen/send/SendTransferScreen";
import { OctName } from "./shared/InputBig";
import {
  ParamListHome,
  ParamListReceive,
  ParamListSend,
  ParamListSettings,
  ParamListTab,
} from "./shared/nav";
import { color } from "./shared/style";
import { useAccount } from "../model/account";

const Tab = createBottomTabNavigator<ParamListTab>();

export function TabNav() {
  const opts: BottomTabNavigationOptions = {
    tabBarHideOnKeyboard: true,
  };
  // Note: don't use unmountOnBlur together with NativeStackNavigator.
  // NativeStackNavigator has a bug where it remembers routes after unmounting,
  // and another where dismissing a modal doesn't change the route.
  const unmount: BottomTabNavigationOptions = {
    ...opts,
    unmountOnBlur: true,
  };

  const ins = useSafeAreaInsets();

  // Track whether we've onboarded. If not, show OnboardingScreen.
  const [account] = useAccount();
  const [isOnboarded, setIsOnboarded] = useState<boolean>(account != null);
  useEffect(() => {
    // This is a latch: if we clear the account, go back to onboarding.
    if (isOnboarded && account == null) setIsOnboarded(false);
  }, [isOnboarded, account]);
  // Stay onboarding till it's complete.
  const onOnboardingComplete = () => setIsOnboarded(true);

  if (!isOnboarded) return <OnboardingScreen {...{ onOnboardingComplete }} />;

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={(props) => getTabOptions(ins, props)}
      backBehavior="none"
    >
      <Tab.Screen name="DepositTab" component={DepositTab} options={unmount} />
      <Tab.Screen name="ReceiveTab" component={ReceiveTab} options={opts} />
      <Tab.Screen name="HomeTab" component={HomeTab} options={opts} />
      <Tab.Screen name="SendTab" component={SendTab} options={opts} />
      <Tab.Screen name="SettingsTab" component={SettingsTab} options={opts} />
    </Tab.Navigator>
  );
}

function getTabOptions(
  safeInsets: EdgeInsets,
  { route }: { route: RouteProp<ParamListTab, keyof ParamListTab> }
): BottomTabNavigationOptions {
  const opts: BottomTabNavigationOptions = {
    headerShown: false,
    tabBarStyle: {
      height: 72 + safeInsets.bottom,
      paddingHorizontal: 16,
      paddingBottom: safeInsets.bottom,
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
  switch (route.name) {
    case "DepositTab":
      return { title: "Deposit", tabBarIcon: getIcon("plus-circle"), ...opts };
    case "ReceiveTab":
      return { title: "Receive", tabBarIcon: getIcon("download"), ...opts };
    case "HomeTab":
      return { title: "Home", tabBarIcon: getIcon("home"), ...opts };
    case "SendTab":
      return { title: "Send", tabBarIcon: getIcon("paper-airplane"), ...opts };
    case "SettingsTab":
      return { title: "Settings", tabBarIcon: getIcon("gear"), ...opts };
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

const noHeaders: NativeStackNavigationOptions = { headerShown: false };

function DepositTab() {
  return <DepositScreen />;
}

const SendStack = createNativeStackNavigator<ParamListSend>();

function SendTab() {
  return (
    <SendStack.Navigator initialRouteName="SendNav" screenOptions={noHeaders}>
      <SendStack.Group>
        <SendStack.Screen name="SendNav" component={SendNavScreen} />
        <SendStack.Screen name="SendTransfer" component={SendTransferScreen} />
      </SendStack.Group>
    </SendStack.Navigator>
  );
}

const HomeStack = createNativeStackNavigator<ParamListHome>();

function HomeTab() {
  return (
    <HomeStack.Navigator initialRouteName="Home" screenOptions={noHeaders}>
      <HomeStack.Group>
        <HomeStack.Screen name="Home" component={HomeScreen} />
        <HomeStack.Screen name="QR" component={QRScreen} />
      </HomeStack.Group>
      <HomeStack.Group screenOptions={{ presentation: "modal" }}>
        <HomeStack.Screen name="HistoryOp" component={HistoryOpScreen} />
      </HomeStack.Group>
    </HomeStack.Navigator>
  );
}

const ReceiveStack = createNativeStackNavigator<ParamListReceive>();

function ReceiveTab() {
  return (
    <ReceiveStack.Navigator
      initialRouteName="Receive"
      screenOptions={noHeaders}
    >
      <ReceiveStack.Group>
        <ReceiveStack.Screen name="Receive" component={ReceiveScreen} />
      </ReceiveStack.Group>
      <ReceiveStack.Group screenOptions={{ presentation: "modal" }}>
        <ReceiveStack.Screen name="Note" component={NoteScreen} />
      </ReceiveStack.Group>
    </ReceiveStack.Navigator>
  );
}

const SettingsStack = createNativeStackNavigator<ParamListSettings>();

function SettingsTab() {
  return (
    <SettingsStack.Navigator screenOptions={noHeaders}>
      <SettingsStack.Screen name="Settings" component={SettingsScreen} />
      <SettingsStack.Screen name="AddDevice" component={AddDeviceScreen} />
      <SettingsStack.Screen name="Device" component={DeviceScreen} />
    </SettingsStack.Navigator>
  );
}
