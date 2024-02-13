import { assertUnreachable } from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import { WINDOW_HEIGHT } from "@gorhom/bottom-sheet";
import {
  MaterialTopTabNavigationOptions,
  createMaterialTopTabNavigator,
} from "@react-navigation/material-top-tabs";
import { RouteProp } from "@react-navigation/native";
import {
  NativeStackNavigationOptions,
  createNativeStackNavigator,
} from "@react-navigation/native-stack";
import {
  StackCardInterpolationProps,
  StackCardStyleInterpolator,
  TransitionPresets,
  createStackNavigator,
} from "@react-navigation/stack";
import { useEffect, useState } from "react";
import { Animated, Platform } from "react-native";
import { EdgeInsets, useSafeAreaInsets } from "react-native-safe-area-context";

import { AccountScreen } from "./screen/AccountScreen";
import { AddDeviceScreen } from "./screen/AddDeviceScreen";
import { AddPasskeyScreen } from "./screen/AddPasskeyScreen";
import { DeviceScreen } from "./screen/DeviceScreen";
import { ErrorScreen } from "./screen/ErrorScreen";
import HomeScreen from "./screen/HomeScreen";
import { QRScreen } from "./screen/QRScreen";
import { SettingsScreen } from "./screen/SettingsScreen";
import NoteScreen from "./screen/link/NoteScreen";
import OnboardingScreen from "./screen/onboarding/OnboardingScreen";
import DepositScreen from "./screen/receive/DepositScreen";
import ReceiveScreen from "./screen/receive/ReceiveScreen";
import { SendNavScreen } from "./screen/send/SendNavScreen";
import { SendNoteScreen } from "./screen/send/SendNoteScreen";
import SendTransferScreen from "./screen/send/SendTransferScreen";
import { OctName } from "./shared/InputBig";
import {
  ParamListHome,
  ParamListMain,
  ParamListReceive,
  ParamListSend,
  ParamListSettings,
  ParamListTab,
  useNav,
} from "./shared/nav";
import { color } from "./shared/style";
import { TAB_BAR_HEIGHT } from "../common/useTabBarHeight";
import { useAccount } from "../model/account";

const { add, multiply } = Animated;

const Tab = createMaterialTopTabNavigator<ParamListTab>();
const MainStack = createStackNavigator<ParamListMain>();

function TabNavigator() {
  const ins = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={(props) => getTabOptions(ins, props)}
      backBehavior="initialRoute"
      tabBarPosition="bottom"
    >
      <Tab.Screen name="DepositTab" component={DepositTab} />
      <Tab.Screen name="ReceiveTab" component={ReceiveTab} />
      <Tab.Screen name="HomeTab" component={HomeTab} />
      <Tab.Screen name="SendTab" component={SendTab} />
      <Tab.Screen name="SettingsTab" component={SettingsTab} />
    </Tab.Navigator>
  );
}

export function TabNav() {
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

  // Error modal slides up from the bottom, greying out the app below.
  const forModalPresentationIOS: StackCardStyleInterpolator = ({
    current,
    next,
    inverted,
    layouts: { screen },
  }: StackCardInterpolationProps) => {
    const progress = add(
      current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
        extrapolate: "clamp",
      }),
      next
        ? next.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
            extrapolate: "clamp",
          })
        : 0
    );

    const translateY = multiply(
      progress.interpolate({
        inputRange: [0, 1, 2],
        outputRange: [screen.height, 0, 0],
      }),
      inverted
    );

    const overlayOpacity = progress.interpolate({
      inputRange: [0, 1, 1.0001, 2],
      outputRange: [0, 0.3, 1, 1],
    });

    return {
      cardStyle: {
        transform: [{ translateY }],
      },
      overlayStyle: { opacity: overlayOpacity },
    };
  };

  return (
    <MainStack.Navigator initialRouteName="MainTabNav">
      <MainStack.Group>
        <MainStack.Screen
          name="MainTabNav"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
      </MainStack.Group>
      <MainStack.Group
        screenOptions={{
          presentation: "modal",
          headerShown: false,
          cardStyle: {
            backgroundColor: "transparent",
          },
        }}
      >
        <MainStack.Screen
          name="LinkErrorModal"
          component={ErrorScreen}
          options={{
            ...TransitionPresets.ModalPresentationIOS,
            detachPreviousScreen: false,
            gestureResponseDistance: WINDOW_HEIGHT,
            cardStyleInterpolator: forModalPresentationIOS,
          }}
        />
      </MainStack.Group>
    </MainStack.Navigator>
  );
}

function getTabOptions(
  safeInsets: EdgeInsets,
  { route }: { route: RouteProp<ParamListTab, keyof ParamListTab> }
): MaterialTopTabNavigationOptions {
  const opts: MaterialTopTabNavigationOptions = {
    animationEnabled: Platform.OS === "ios", // android text input breaks if enabled
    tabBarStyle: {
      height: TAB_BAR_HEIGHT + safeInsets.bottom,
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
      width: 100,
      textTransform: "none",
    },
    tabBarActiveTintColor: color.primary,
    tabBarInactiveTintColor: color.grayMid,
    tabBarIndicatorStyle: {
      opacity: 0,
    },
    tabBarIconStyle: {
      alignItems: "center",
    },
    tabBarAllowFontScaling: false,
  };
  switch (route.name) {
    case "DepositTab":
      return { title: "Deposit", tabBarIcon: getIcon("plus-circle"), ...opts };
    case "ReceiveTab":
      return { title: "Request", tabBarIcon: getIcon("download"), ...opts };
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
        <SendStack.Screen name="QR" component={QRScreen} />
        <SendStack.Screen name="SendLink" component={SendNoteScreen} />
        <HomeStack.Screen name="Account" component={AccountScreen} />
      </SendStack.Group>
    </SendStack.Navigator>
  );
}

const HomeStack = createNativeStackNavigator<ParamListHome>();

function HomeTab() {
  // When tapping Home again, navigate to the top of the stack.
  const nav = useNav();
  useEffect(() => {
    // @ts-ignore
    const unsub = nav.addListener("tabPress", () => {
      nav.navigate("HomeTab", { screen: "Home" });
    });
    return unsub;
  });

  return (
    <HomeStack.Navigator initialRouteName="Home" screenOptions={noHeaders}>
      <HomeStack.Group>
        <HomeStack.Screen name="Home" component={HomeScreen} />
        <HomeStack.Screen name="QR" component={QRScreen} />
        <HomeStack.Screen name="Account" component={AccountScreen} />
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
      <SettingsStack.Screen name="AddPasskey" component={AddPasskeyScreen} />
      <SettingsStack.Screen name="Device" component={DeviceScreen} />
    </SettingsStack.Navigator>
  );
}
