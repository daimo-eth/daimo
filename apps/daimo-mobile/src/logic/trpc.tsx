import type { AppRouter } from "@daimo/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { ReactNode, useState } from "react";
import { Platform } from "react-native";

import { env } from "./env";

export const rpcHook = createTRPCReact<AppRouter>();

const opts = {
  links: [
    httpBatchLink({
      url: env.apiUrl,
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        console.log(`[APP] trpc fetching ${input}`, init);

        init = init ?? {};
        init.headers = (init.headers ?? {}) as Record<string, string>;
        init.headers["x-daimo-platform"] = `${Platform.OS} ${Platform.Version}`;
        const v = `${env.nativeApplicationVersion} #${env.nativeBuildVersion}`;
        init.headers["x-daimo-version"] = v;

        return fetch(input, init);
      },
    }),
  ],
  transformer: undefined,
};

export const rpcFunc = createTRPCProxyClient<AppRouter>(opts);

/** Connect to the TRPC API. */
export function RpcProvider({ children }: { children: ReactNode }) {
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
  const [trpcClient] = useState(() => rpcHook.createClient(opts));

  return (
    <rpcHook.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </rpcHook.Provider>
  );
}
