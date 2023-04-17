import { useAccount } from "./logic/account";
import { StubChain } from "./logic/chain";
import HomeScreen from "./view/screen/HomeScreen";
import OnboardingScreen from "./view/screen/OnboardingScreen";

const chain = new StubChain();

export default function App() {
  const [account] = useAccount();

  if (!account) {
    return <OnboardingScreen chain={chain} />;
  }
  return <HomeScreen />;
}
