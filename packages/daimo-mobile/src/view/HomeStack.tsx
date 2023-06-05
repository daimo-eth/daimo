import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAccount } from "../logic/account";
import HomeScreen from "./screen/HomeScreen";
import OnboardingScreen from "./screen/OnboardingScreen";
import { UserScreen } from "./screen/UserScreen";
import { ChainScreen } from "./screen/ChainScreen";
import DepositScreen from "./screen/DepositScreen";
import ReceiveScreen from "./screen/ReceiveScreen";
import RequestScreen from "./screen/RequestScreen";
import SendScreen from "./screen/SendScreen";

import { Recipient } from "../logic/search";

export type HomeStackParamList = {
  Home: undefined;
  User: undefined;
  Chain: undefined;
  Send: undefined | { recipient: Recipient };
  Receive: undefined;
  Deposit: undefined;
  Request: undefined;
};

const HomeStack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStackNav() {
  return (
    <HomeStack.Navigator initialRouteName="Home">
      <HomeStack.Group>
        <HomeStack.Screen name="Home" component={MainScreen} />
        <HomeStack.Screen name="Send" component={SendScreen} />
        <HomeStack.Screen name="Receive" component={ReceiveScreen} />
      </HomeStack.Group>
      <HomeStack.Group screenOptions={{ presentation: "modal" }}>
        <HomeStack.Screen name="User" component={UserScreen} />
        <HomeStack.Screen name="Chain" component={ChainScreen} />
        <HomeStack.Screen name="Deposit" component={DepositScreen} />
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
