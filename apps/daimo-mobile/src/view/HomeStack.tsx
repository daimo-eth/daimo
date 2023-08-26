import { tokenMetadata } from "@daimo/contract";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";

import { AddDeviceScreen } from "./screen/AddDeviceScreen";
import { DeviceScreen } from "./screen/DeviceScreen";
import { HistoryScreen } from "./screen/History";
import { HistoryOpScreen } from "./screen/HistoryOpScreen";
import HomeScreen from "./screen/HomeScreen";
import OnboardingScreen from "./screen/OnboardingScreen";
import { SettingsScreen } from "./screen/SettingsScreen";
import NoteScreen from "./screen/link/NoteScreen";
import CreateRequestScreen from "./screen/receive/CreateRequestScreen";
import DepositScreen from "./screen/receive/DepositScreen";
import SendRequestScreen from "./screen/receive/SendRequestScreen";
import SendScreen from "./screen/send/SendScreen";
import WithdrawScreen from "./screen/send/WithdrawScreen";
import { HomeStackParamList } from "./shared/nav";
import { useAccount } from "../model/account";

const HomeStack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStackNav() {
  const [account] = useAccount();

  return (
    <HomeStack.Navigator initialRouteName="Home">
      <HomeStack.Group>
        <HomeStack.Screen
          name="Home"
          component={MainScreen}
          options={useMemo(() => ({ headerShown: !!account }), [account])}
        />
        <HomeStack.Screen name="Send" component={SendScreen} />
        <HomeStack.Screen name="Request" component={CreateRequestScreen} />
        <HomeStack.Screen
          name="History"
          component={HistoryScreen}
          options={useMemo(() => ({ animation: "slide_from_bottom" }), [])}
        />
      </HomeStack.Group>
      <HomeStack.Group screenOptions={{ presentation: "modal" }}>
        <HomeStack.Screen name="Settings" component={SettingsScreen} />
        <HomeStack.Screen name="Deposit" component={DepositScreen} />
        <HomeStack.Screen name="Withdraw" component={WithdrawScreen} />
        <HomeStack.Screen
          name="Note"
          options={{ headerTitle: "Payment Link" }}
          component={NoteScreen}
        />
        <HomeStack.Screen
          name="RequestSend"
          options={{ headerTitle: `Request ${tokenMetadata.symbol}` }}
          component={SendRequestScreen}
        />
        <HomeStack.Screen name="HistoryOp" component={HistoryOpScreen} />
        <HomeStack.Screen
          name="AddDevice"
          component={AddDeviceScreen}
          options={{ title: "Add Device" }}
        />
        <HomeStack.Screen name="Device" component={DeviceScreen} />
      </HomeStack.Group>
    </HomeStack.Navigator>
  );
}

function MainScreen() {
  const [account] = useAccount();
  const [isOnboarding, setIsOnboarding] = useState<boolean>(account === null);
  const onOnboardingComplete = () => setIsOnboarding(false);

  if (account && !isOnboarding) return <HomeScreen />;
  return <OnboardingScreen onOnboardingComplete={onOnboardingComplete} />;
}
