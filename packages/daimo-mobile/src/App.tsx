import { NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { Text } from "react-native";
import PolyfillCrypto from "react-native-webview-crypto";

import { useAccount } from "./logic/account";
import { Chain, ChainContext, ChainStatus, ViemChain } from "./logic/chain";
import { trpc } from "./logic/trpc";
import { HomeStackNav } from "./view/HomeStack";

export default function App() {
  console.log("[APP] rendering\n\n");
  const [account, setAccount] = useAccount();
  const [status, setStatus] = useState<ChainStatus>();
  const chain = useMemo<Chain>(() => new ViemChain(), []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2,
            retryDelay: 500,
          },
        },
      })
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "http://localhost:3000",
          fetch: (input: RequestInfo | URL, init?: RequestInit) => {
            console.log(`[APP] trpc fetching ${input}`);
            return fetch(input, init);
          },
        }),
      ],
      transformer: undefined,
    })
  );

  const refreshAccount = async () => {
    try {
      console.log(`[APP] Loading chain status...`);
      const status = await chain.getStatus();
      setStatus(status);

      if (!account || status.status !== "ok") return;
      console.log(`[APP] Reloading account ${account.address}...`);
      setAccount(await chain.updateAccount(account, status));
    } catch (e) {
      console.error(e);
    }
  };

  // Refresh whenever the account changes, then periodically
  useEffect(() => {
    refreshAccount();
    // TODO: subscribe for instant update
    const interval = setInterval(refreshAccount, 30000);
    return () => clearInterval(interval);
  }, [account?.address]);

  const cs = useMemo(() => ({ chain, status }), [chain, status]);

  const linking = useMemo(() => ({ prefixes: [Linking.createURL("/")] }), []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer
          linking={linking}
          fallback={<Text>Loading...</Text>}
        >
          <ChainContext.Provider value={cs}>
            <PolyfillCrypto />
            <HomeStackNav />
            <StatusBar style="auto" />
          </ChainContext.Provider>
        </NavigationContainer>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
