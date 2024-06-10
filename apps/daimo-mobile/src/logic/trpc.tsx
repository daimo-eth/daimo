import type { AppRouter } from "@daimo/api";
import { assert } from "@daimo/common";
import { DaimoChain } from "@daimo/contract";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  CreateTRPCClientOptions,
  createTRPCClient,
  createWSClient,
  httpBatchLink,
  httpLink,
  splitLink,
  wsLink,
} from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { nativeApplicationVersion, nativeBuildVersion } from "expo-application";
import { ReactNode, createContext } from "react";
import { Platform } from "react-native";

import { updateNetworkStateOnline } from "../sync/networkState";

const apiUrlT =
  process.env.DAIMO_APP_API_URL_TESTNET || process.env.DAIMO_APP_API_URL;
const apiUrlTestnetWithChain = `${apiUrlT}/chain/84532`;
const apiUrlM =
  process.env.DAIMO_APP_API_URL_MAINNET || process.env.DAIMO_APP_API_URL;
const apiUrlMainnetWithChain = `${apiUrlM}/chain/8453`;

function createRpcHook() {
  const reactQueryContext = createContext<QueryClient | undefined>(undefined);
  return {
    trpc: createTRPCReact<AppRouter>({ context: reactQueryContext }),
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
    ["base", "baseSepolia"].includes(daimoChain),
    `Unsupported chain: ${daimoChain}`
  );
  if (daimoChain === "base") return mainnet;
  else return testnet;
}

const customTRPCfetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
) => {
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
  console.log(`[TRPC] fetching ${url}, timeout ${timeout}ms`, init);
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
  const ms = (performance.now() - startMs) | 0;
  const method = init.method || "GET";
  console.log(`[TRPC] ${method} ${func} ${ret.status} in ${ms}ms`);

  return ret;
};

function getTRPCOpts(
  daimoChain: DaimoChain
): CreateTRPCClientOptions<AppRouter> {
  const url = chooseChain({
    daimoChain,
    mainnet: apiUrlMainnetWithChain,
    testnet: apiUrlTestnetWithChain,
  });

  let daimoLink = splitLink({
    condition(op) {
      return op.type === "subscription";
    },

    true: wsLink({
      client: createWSClient({
        url,
      }),
    }),

    false: httpBatchLink({
      url,
      fetch: customTRPCfetch,
    }),
  });

  // TRPC client tries to connect to WebSocket on creation which breaks
  // test environment that expects any resources to be defined explicitly in unit body
  // or mocked altogether.
  // Since TRPC client is currently tangled together with top-level code,
  // we avoid using WebSocket link when running in no-browser environment (like tests.)
  if (typeof WebSocket === "undefined") {
    console.error("WebSocket not available, skipping websocket link");

    daimoLink = httpBatchLink({
      url: chooseChain({
        daimoChain,
        mainnet: apiUrlMainnetWithChain,
        testnet: apiUrlTestnetWithChain,
      }),
      fetch: customTRPCfetch,
    });
  }

  return {
    links: [daimoLink],
  };
}

const optsMainnet = getTRPCOpts("base");
const optsTestnet = getTRPCOpts("baseSepolia");
const rpcHookMainnetClient = rpcHookMainnet.trpc.createClient(optsMainnet);
const rpcHookTestnetClient = rpcHookTestnet.trpc.createClient(optsTestnet);

type RpcClient = typeof rpcHookMainnetClient | typeof rpcHookTestnetClient;

const rpcFuncMainnet = createTRPCClient<AppRouter>(optsMainnet);
const rpcFuncTestnet = createTRPCClient<AppRouter>(optsTestnet);

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
      <QueryClientProvider client={rpcHook.queryClient}>
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
