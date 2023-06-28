import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useMemo } from "react";

import { AccountScreen } from "./screen/AccountScreen";
import { ChainScreen } from "./screen/ChainScreen";
import { HistoryOpScreen } from "./screen/HistoryOpScreen";
import HomeScreen from "./screen/HomeScreen";
import OnboardingScreen from "./screen/OnboardingScreen";
import ClaimNoteScreen from "./screen/receive/ClaimNoteScreen";
import DepositScreen from "./screen/receive/DepositScreen";
import ReceiveScreen from "./screen/receive/ReceiveScreen";
import RequestScreen from "./screen/receive/RequestScreen";
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
        <HomeStack.Screen name="Receive" component={ReceiveScreen} />
      </HomeStack.Group>
      <HomeStack.Group screenOptions={{ presentation: "modal" }}>
        <HomeStack.Screen name="Account" component={AccountScreen} />
        <HomeStack.Screen name="Chain" component={ChainScreen} />
        <HomeStack.Screen name="Deposit" component={DepositScreen} />
        <HomeStack.Screen name="Withdraw" component={WithdrawScreen} />
        <HomeStack.Screen name="Note" component={ClaimNoteScreen} />
        <HomeStack.Screen name="Request" component={RequestScreen} />
        <HomeStack.Screen name="HistoryOp" component={HistoryOpScreen} />
      </HomeStack.Group>
    </HomeStack.Navigator>
  );
}

function MainScreen() {
  const [account] = useAccount();
  if (account) return <HomeScreen />;
  return <OnboardingScreen />;
}
