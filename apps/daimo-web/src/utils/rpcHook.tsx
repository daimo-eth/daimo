"use client";

import type { AppRouter } from "@daimo/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { ReactNode, createContext } from "react";

import { apiUrlWithChain } from "./rpc";

function createRpcHook() {
  const reactQueryContext = createContext<QueryClient | undefined>(undefined);
  return {
    trpc: createTRPCReact<AppRouter>({
      //@ts-ignore
      context: createContext(null),
      //@ts-ignore
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
        //@ts-ignore
        context={rpcHook.reactQueryContext}
      >
        {children}
      </QueryClientProvider>
    </rpcHook.trpc.Provider>
  );
}
