import { AppRouter } from "@daimo/api";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";

import { chainConfig } from "../env";

const apiUrl = process.env.NEXT_PUBLIC_DAIMO_API_URL || "http://localhost:3000";
export const apiUrlWithChain = `${apiUrl}/chain/${chainConfig.chainL2.id}`;

// @ts-ignore
export const rpc = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({ url: apiUrlWithChain })],
});
