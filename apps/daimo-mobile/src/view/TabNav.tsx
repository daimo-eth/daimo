import { assertUnreachable } from "@daimo/common";
import { chainConfig } from "@daimo/contract";
import Octicons from "@expo/vector-icons/Octicons";
import {
  BottomTabNavigationOptions,
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import { RouteProp } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";

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
} from "./shared/nav";
import { color } from "./shared/style";
import { useAccount } from "../model/account";

const Tab = createBottomTabNavigator<ParamListTab>();

export function TabNav() {
  return (
    <Tab.Navigator initialRouteName="HomeTab" screenOptions={getTabOptions}>
      <Tab.Screen name="DepositTab" component={DepositTab} />
      <Tab.Screen name="SendTab" component={SendTab} />
      <Tab.Screen name="HomeTab" component={HomeTab} />
      <Tab.Screen name="ReceiveTab" component={ReceiveTab} />
      <Tab.Screen name="SettingsTab" component={SettingsTab} />
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
      height: 72,
      paddingTop: 16,
      paddingHorizontal: 16,
    },
    tabBarItemStyle: {
      height: 44,
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
    <SendStack.Navigator initialRouteName="Send">
      <SendStack.Group>
        <SendStack.Screen name="Send" component={SendScreen} />
      </SendStack.Group>
      <SendStack.Group screenOptions={{ presentation: "modal" }}>
        <SendStack.Screen
          name="Note"
          options={{ headerTitle: "Payment Link" }}
          component={NoteScreen}
        />
      </SendStack.Group>
    </SendStack.Navigator>
  );
}

const HomeStack = createNativeStackNavigator<ParamListHome>();

function HomeTab() {
  const noHead = useMemo(() => ({ headerShown: false }), []);
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
