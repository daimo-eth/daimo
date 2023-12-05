import type { AppRouter } from "@daimo/api";
import { assert } from "@daimo/common";
import { DaimoChain } from "@daimo/contract";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { nativeApplicationVersion, nativeBuildVersion } from "expo-application";
import { ReactNode, createContext } from "react";
import { Platform } from "react-native";

import { updateNetworkStateOnline } from "../sync/networkState";

const apiUrlTestnet =
  process.env.DAIMO_APP_API_URL_TESTNET || "http://localhost:3000";
const apiUrlTestnetWithChain = `${apiUrlTestnet}/chain/84531`;
const apiUrlMainnet =
  process.env.DAIMO_APP_API_URL_MAINNET || "http://localhost:3000";
const apiUrlMainnetWithChain = `${apiUrlMainnet}/chain/8453`;

function createRpcHook() {
  const reactQueryContext = createContext<QueryClient | undefined>(undefined);
  return {
    trpc: createTRPCReact<AppRouter>({
      context: createContext(null),
      reactQueryContext,
    }),
    reactQueryContext,
    queryClient: new QueryClient({
      defaultOptions: {
        queries: {
          retry: 2,
          retryDelay: 500,
        },
      },
    }),
  };
}

type RpcHook = ReturnType<typeof createRpcHook>;

const rpcHookMainnet = createRpcHook();
const rpcHookTestnet = createRpcHook();

function chooseChain<T>({
  daimoChain,
  mainnet,
  testnet,
}: {
  daimoChain: DaimoChain;
  mainnet: T;
  testnet: T;
}): T {
  assert(
    ["base", "baseGoerli"].includes(daimoChain),
    `Unsupported chain: ${daimoChain}`
  );
  if (daimoChain === "base") return mainnet;
  else return testnet;
}

function getOpts(daimoChain: DaimoChain) {
  return {
    links: [
      httpBatchLink({
        url: chooseChain({
          daimoChain,
          mainnet: apiUrlMainnetWithChain,
          testnet: apiUrlTestnetWithChain,
        }),
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
          const url = (() => {
            if (input instanceof URL) return input;
            else if (input instanceof Request) return new URL(input.url);
            else return new URL(input);
          })();

          init = init ?? {};
          init.headers = (init.headers ?? {}) as Record<string, string>;

          const platform = `${Platform.OS} ${Platform.Version}`;
          const version = `${nativeApplicationVersion} #${nativeBuildVersion}`;
          init.headers["x-daimo-platform"] = platform;
          init.headers["x-daimo-version"] = version;

          // Fetch timeout
          const { pathname } = url;
          const func = pathname.split("/").slice(-1)[0] as keyof AppRouter;
          const timeout = (() => {
            if (func === "deployWallet") return 60_000; // 1 minute
            else return 10_000; // default: 10 seconds
          })();
          console.log(`[TRPC] fetching ${url}, timout ${timeout}ms`, init);
          const controller = new AbortController();
          const timeoutID = setTimeout(() => {
            console.log(`[TRPC] timeout after ${timeout}ms: ${input}`);
            controller.abort();
          }, timeout);
          init.signal = controller.signal;

          // Fetch
          const startMs = performance.now();
          const ret = await fetch(input, init).then((res) => {
            // When a request succeeds, mark us online immediately.
            if (res.ok) updateNetworkStateOnline();
            return res;
          });
          clearTimeout(timeoutID);

          // Log
          const ms = performance.now() - startMs;
          const method = init.method || "GET";
          console.log(`[TRPC] ${method} ${func} ${ret.status} in ${ms}`);

          return ret;
        },
      }),
    ],
    transformer: undefined,
  };
}

const rpcHookMainnetClient = rpcHookMainnet.trpc.createClient(getOpts("base"));
const rpcHookTestnetClient = rpcHookTestnet.trpc.createClient(
  getOpts("baseGoerli")
);

type RpcClient = typeof rpcHookMainnetClient | typeof rpcHookTestnetClient;

const rpcFuncMainnet = createTRPCProxyClient<AppRouter>(getOpts("base"));
const rpcFuncTestnet = createTRPCProxyClient<AppRouter>(getOpts("baseGoerli"));

export function getRpcFunc(daimoChain: DaimoChain) {
  return chooseChain({
    daimoChain,
    mainnet: rpcFuncMainnet,
    testnet: rpcFuncTestnet,
  });
}

export function getRpcHook(daimoChain: DaimoChain) {
  return chooseChain({
    daimoChain,
    mainnet: rpcHookMainnet.trpc,
    testnet: rpcHookTestnet.trpc,
  });
}

/** Connect to the TRPC API. */
function ChainRpcProvider({
  rpcHook,
  rpcClient,
  children,
}: {
  rpcHook: RpcHook;
  rpcClient: RpcClient;
  children: ReactNode;
}) {
  return (
    <rpcHook.trpc.Provider queryClient={rpcHook.queryClient} client={rpcClient}>
      <QueryClientProvider
        client={rpcHook.queryClient}
        context={rpcHook.reactQueryContext}
      >
        {children}
      </QueryClientProvider>
    </rpcHook.trpc.Provider>
  );
}

export function RpcProvider({ children }: { children: ReactNode }) {
  return (
    <ChainRpcProvider rpcHook={rpcHookMainnet} rpcClient={rpcHookMainnetClient}>
      <ChainRpcProvider
        rpcHook={rpcHookTestnet}
        rpcClient={rpcHookTestnetClient}
      >
        {children}
      </ChainRpcProvider>
    </ChainRpcProvider>
  );
}
