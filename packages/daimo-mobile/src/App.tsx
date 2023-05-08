import "fast-text-encoding";
import { useEffect, useMemo, useState } from "react";

import { useAccount } from "./logic/account";
import { ChainStatus, ChainContext, ViemChain, Chain } from "./logic/chain";
import HomeScreen from "./view/screen/HomeScreen";
import OnboardingScreen from "./view/screen/OnboardingScreen";

export default function App() {
  const [account, setAccount] = useAccount();
  const [status, setStatus] = useState<ChainStatus>();
  const chain = useMemo<Chain>(() => new ViemChain(), []);

  const refreshAccount = async () => {
    console.log(`[APP] Loading chain status...`);
    const status = await chain.getStatus();
    setStatus(status);

    if (!account || status.status !== "ok") return;
    console.log(`[APP] Loading account ${account.address}...`);
    setAccount(await chain.getAccount(account.address, status));
  };

  // Refresh whenever the account changes, then periodically
  useEffect(() => {
    refreshAccount();
    // TODO: subscribe for instant update
    const interval = setInterval(refreshAccount, 30000);
    return () => clearInterval(interval);
  }, [account?.address]);

  const cs = useMemo(() => ({ chain, status }), [chain, status]);

  return (
    <ChainContext.Provider value={cs}>
      {!account && <OnboardingScreen />}
      {account && <HomeScreen />}
    </ChainContext.Provider>
  );
}
