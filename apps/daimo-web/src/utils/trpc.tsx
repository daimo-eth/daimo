"use client";

import type { AppRouter } from "@daimo/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { ReactNode, createContext } from "react";

import { chainConfig } from "../env";

const apiUrl = process.env.DAIMO_APP_API_URL || "http://localhost:3000";
const apiUrlWithChain = `${apiUrl}/chain/${chainConfig.chainL2.id}`;

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({ url: apiUrlWithChain })],
});

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

export const rpcHook = createRpcHook();

const rpcClient = rpcHook.trpc.createClient({
  links: [httpBatchLink({ url: apiUrlWithChain })],
});

export function RpcHookProvider({ children }: { children: ReactNode }) {
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
