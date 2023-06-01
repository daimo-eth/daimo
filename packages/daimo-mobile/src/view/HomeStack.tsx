import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAccount } from "../logic/account";
import HomeScreen from "./screen/HomeScreen";
import OnboardingScreen from "./screen/OnboardingScreen";
import { UserScreen } from "./screen/UserScreen";
import { ChainScreen } from "./screen/ChainScreen";
import DepositScreen from "./screen/DepositScreen";

export type HomeStackParamList = {
  Home: undefined;
  User: undefined;
  Chain: undefined;
  Deposit: undefined;
};

const HomeStack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStackNav() {
  return (
    <HomeStack.Navigator initialRouteName="Home">
      <HomeStack.Group>
        <HomeStack.Screen name="Home" component={MainScreen} />
        <HomeStack.Screen name="Deposit" component={DepositScreen} />
      </HomeStack.Group>
      <HomeStack.Group screenOptions={{ presentation: "modal" }}>
        <HomeStack.Screen name="User" component={UserScreen} />
        <HomeStack.Screen name="Chain" component={ChainScreen} />
      </HomeStack.Group>
    </HomeStack.Navigator>
  );
}

function MainScreen() {
  const [account] = useAccount();
  if (account) return <HomeScreen />;
  return <OnboardingScreen />;
}
