import type { AppRouter } from "@daimo/api";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";

import { chainConfig } from "../env";

const apiUrl = process.env.DAIMO_APP_API_URL || "http://localhost:3000";
export const apiUrlWithChain = `${apiUrl}/chain/${chainConfig.chainL2.id}`;

export const rpc = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({ url: apiUrlWithChain })],
});
