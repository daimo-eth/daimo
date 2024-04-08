import { assertEqual, assertUnreachable } from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import { WINDOW_HEIGHT } from "@gorhom/bottom-sheet";
import {
  BottomTabNavigationOptions,
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import { RouteProp } from "@react-navigation/native";
import {
  NativeStackNavigationOptions,
  createNativeStackNavigator,
} from "@react-navigation/native-stack";
import {
  StackCardInterpolatedStyle,
  StackCardInterpolationProps,
  TransitionPresets,
  createStackNavigator,
} from "@react-navigation/stack";
import { useEffect } from "react";
import { Animated, Platform } from "react-native";
import { EdgeInsets, useSafeAreaInsets } from "react-native-safe-area-context";

import DepositScreen from "./screen/DepositScreen";
import HomeScreen from "./screen/HomeScreen";
import { InviteScreen } from "./screen/InviteScreen";
import { ProfileScreen } from "./screen/ProfileScreen";
import { QRScreen } from "./screen/QRScreen";
import { SettingsScreen } from "./screen/SettingsScreen";
import { YourInvitesScreen } from "./screen/YourInvitesScreen";
import { ErrorScreen } from "./screen/errorScreens";
import { AddDeviceScreen } from "./screen/keyRotation/AddDeviceScreen";
import { AddPasskeyScreen } from "./screen/keyRotation/AddPasskeyScreen";
import { DeviceScreen } from "./screen/keyRotation/DeviceScreen";
import NoteScreen from "./screen/link/NoteScreen";
import { NotificationsScreen } from "./screen/notifications/NotificationsScreen";
import { MissingKeyScreen } from "./screen/onboarding/MissingKeyScreen";
import { OnboardingAllowNotifsScreen as OnbAllowNotifsScreen } from "./screen/onboarding/OnboardingAllowNotifsScreen";
import { OnboardingEnterInviteScreen as OnbEnterInviteScreen } from "./screen/onboarding/OnboardingEnterInviteScreen";
import { OnboardingFinishScreen } from "./screen/onboarding/OnboardingFinishScreen";
import { OnboardingIntroScreen as OnbIntroScreen } from "./screen/onboarding/OnboardingIntroScreen";
import { OnboardingPickNameScreen as OnbPickNameScreen } from "./screen/onboarding/OnboardingPickNameScreen";
import { OnboardingSetupKeyPage as OnbSetupKeyPage } from "./screen/onboarding/OnboardingSetupKeyPage";
import { OnboardingUseExistingScreen as OnbUseExistingScreen } from "./screen/onboarding/OnboardingUseExistingScreen";
import { usePollForAccount } from "./screen/onboarding/usePollForAccount";
import { ReceiveNavScreen } from "./screen/receive/ReceiveNavScreen";
import { ReceiveScreen } from "./screen/receive/ReceiveScreen";
import { SendNavScreen } from "./screen/send/SendNavScreen";
import { SendNoteScreen } from "./screen/send/SendNoteScreen";
import SendTransferScreen from "./screen/send/SendTransferScreen";
import { IconHome } from "./shared/IconHome";
import { OctName } from "./shared/InputBig";
import { color } from "./shared/style";
import {
  ParamListHome,
  ParamListInvite,
  ParamListMain,
  ParamListOnboarding,
  ParamListSend,
  ParamListSettings,
  ParamListTab,
  useNav,
  useOnboardingDeepLinkHandler,
} from "../common/nav";
import { TAB_BAR_HEIGHT } from "../common/useTabBarHeight";
import { useAccountAndKeyInfo, useDaimoChain } from "../logic/accountManager";

const { add, multiply } = Animated;

// Onboarding navigator.
const OnStack = createStackNavigator<ParamListOnboarding>();
function OnboardingNavigator() {
  const daimoChain = useDaimoChain();

  // Two external events can cause us to jump to a different screen.
  // 1. A deep link arrives (go straight to "choose name")
  useOnboardingDeepLinkHandler(daimoChain);

  // 2. We find an account that we have an enclave key for. "Allow notifs"
  usePollForAccount();

  return (
    <OnStack.Navigator
      initialRouteName="Intro"
      screenOptions={{ headerShown: false }}
    >
      <OnStack.Screen name="Intro" component={OnbIntroScreen} />
      <OnStack.Screen name="CreateNew" component={OnbEnterInviteScreen} />
      <OnStack.Screen name="CreateSetupKey" component={OnbSetupKeyPage} />
      <OnStack.Screen name="CreatePickName" component={OnbPickNameScreen} />
      <OnStack.Screen name="ExistingSetupKey" component={OnbSetupKeyPage} />
      <OnStack.Screen name="UseExisting" component={OnbUseExistingScreen} />
      <OnStack.Screen
        name="AllowNotifs"
        component={OnbAllowNotifsScreen}
        options={{ gestureEnabled: false }}
      />
      <OnStack.Screen
        name="Finish"
        component={OnboardingFinishScreen}
        options={{ gestureEnabled: false }}
      />
    </OnStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<ParamListTab>();
const MainStack = createStackNavigator<ParamListMain>();

// Main, logged-in bottom tab navigator.
function MainTabNavigator() {
  const opts: BottomTabNavigationOptions = {
    // On Android, the tab bar jumps above the keyboard. This prevents that.
    // But on iOS, enabling this option can cause the screen to resize when the
    // keyboard transitions, making the transitions look a bit janky.
    tabBarHideOnKeyboard: Platform.OS === "android",
  };

  const ins = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={(props) => getTabOptions(ins, props)}
      backBehavior="initialRoute"
    >
      <Tab.Screen name="DepositTab" component={DepositTab} options={opts} />
      <Tab.Screen name="InviteTab" component={InviteTab} options={opts} />
      <Tab.Screen name="HomeTab" component={HomeTab} options={opts} />
      <Tab.Screen name="SendTab" component={SendTab} options={opts} />
      <Tab.Screen name="SettingsTab" component={SettingsTab} options={opts} />
    </Tab.Navigator>
  );
}

// Outer navigator. Multiplexes between Onboarding and MainTabNavigator.
export function TabNav() {
  const { account, keyInfo } = useAccountAndKeyInfo();

  // No account? Create an account + enclave key.
  if (account == null || !account.isOnboarded) {
    return <OnboardingNavigator />;
  }

  // Ensure enclave key is present onchain. Otherwise, show error.
  if (account != null && keyInfo != null) {
    assertEqual(keyInfo.enclaveKeyName, account.enclaveKeyName);
    const { pubKeyHex } = keyInfo;
    if (
      account.enclavePubKey !== pubKeyHex ||
      account.accountKeys.find((k) => k.pubKey === pubKeyHex) == null
    ) {
      return <MissingKeyScreen />;
    }
  }
  // Logged-in app.
  return (
    <MainStack.Navigator initialRouteName="MainTabNav">
      <MainStack.Group>
        <MainStack.Screen
          name="MainTabNav"
          component={MainTabNavigator}
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
            cardStyleInterpolator: errorBottomSheetInterpolator,
          }}
        />
      </MainStack.Group>
    </MainStack.Navigator>
  );
}

// Error modal slides up from the bottom, greying out the app below.
// This custom interpolator recreates the native background effect.
function errorBottomSheetInterpolator({
  current,
  next,
  inverted,
  layouts: { screen },
}: StackCardInterpolationProps): StackCardInterpolatedStyle {
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
}

function getTabOptions(
  safeInsets: EdgeInsets,
  { route }: { route: RouteProp<ParamListTab, keyof ParamListTab> }
): BottomTabNavigationOptions {
  const opts: BottomTabNavigationOptions = {
    headerShown: false,
    tabBarStyle: {
      height: TAB_BAR_HEIGHT + safeInsets.bottom,
      paddingBottom: safeInsets.bottom,
    },
    tabBarLabelPosition: "below-icon",
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
    tabBarIconStyle: {
      alignItems: "center",
    },
    tabBarAllowFontScaling: false,
    lazy: false,
  };
  switch (route.name) {
    case "DepositTab":
      return { title: "Deposit", tabBarIcon: getIcon("plus-circle"), ...opts };
    case "InviteTab":
      return { title: "Invite", tabBarIcon: getIcon("mail"), ...opts };
    case "HomeTab":
      return {
        title: "Home",
        tabBarIcon: ({ color }) => {
          return <IconHome color={color} />;
        },
        ...opts,
      };
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
        <SendStack.Screen name="Profile" component={ProfileScreen} />
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
        <HomeStack.Screen name="Profile" component={ProfileScreen} />
        <HomeStack.Screen name="Note" component={NoteScreen} />
        <HomeStack.Screen name="Receive" component={ReceiveScreen} />
        <HomeStack.Screen name="ReceiveNav" component={ReceiveNavScreen} />
        <HomeStack.Screen
          name="Notifications"
          component={NotificationsScreen}
        />
      </HomeStack.Group>
    </HomeStack.Navigator>
  );
}

const InviteStack = createNativeStackNavigator<ParamListInvite>();

function InviteTab() {
  return (
    <InviteStack.Navigator initialRouteName="Invite" screenOptions={noHeaders}>
      <InviteStack.Group>
        <InviteStack.Screen name="Invite" component={InviteScreen} />
        <InviteStack.Screen name="YourInvites" component={YourInvitesScreen} />
        <InviteStack.Screen name="Profile" component={ProfileScreen} />
      </InviteStack.Group>
    </InviteStack.Navigator>
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
