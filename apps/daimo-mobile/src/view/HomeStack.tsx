import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useMemo } from "react";

import { AccountScreen } from "./screen/AccountScreen";
import { ChainScreen } from "./screen/ChainScreen";
import DepositScreen from "./screen/DepositScreen";
import HomeScreen from "./screen/HomeScreen";
import NoteScreen from "./screen/NoteScreen";
import OnboardingScreen from "./screen/OnboardingScreen";
import ReceiveScreen from "./screen/ReceiveScreen";
import RequestScreen from "./screen/RequestScreen";
import SendScreen from "./screen/SendScreen";
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
        <HomeStack.Screen name="Receive" component={ReceiveScreen} />
      </HomeStack.Group>
      <HomeStack.Group screenOptions={{ presentation: "modal" }}>
        <HomeStack.Screen name="Account" component={AccountScreen} />
        <HomeStack.Screen name="Chain" component={ChainScreen} />
        <HomeStack.Screen name="Deposit" component={DepositScreen} />
        <HomeStack.Screen name="Note" component={NoteScreen} />
        <HomeStack.Screen name="Request" component={RequestScreen} />
      </HomeStack.Group>
    </HomeStack.Navigator>
  );
}

function MainScreen() {
  const [account] = useAccount();
  if (account) return <HomeScreen />;
  return <OnboardingScreen />;
}
