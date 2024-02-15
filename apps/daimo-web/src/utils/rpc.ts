import type { AppRouter } from "@daimo/api";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";

import { chainConfig } from "../env";

const apiUrl = process.env.NEXT_PUBLIC_DAIMO_API_URL || "http://localhost:3000";
export const apiUrlWithChain = `${apiUrl}/chain/${chainConfig.chainL2.id}`;

async function fetchAndLog(input: RequestInfo | URL, init?: RequestInit) {
  init = init ?? {};

  const url = (() => {
    if (input instanceof URL) return input;
    else if (input instanceof Request) return new URL(input.url);
    else return new URL(input);
  })();

  const startMs = performance.now();
  const ret = await fetch(input, init);

  const ms = (performance.now() - startMs) | 0;
  const method = init.method || "GET";
  console.log(`[TRPC] ${method} ${url} ${ret.status} in ${ms}ms`);

  return ret;
}

export const rpc = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({ url: apiUrlWithChain, fetch: fetchAndLog })],
});
