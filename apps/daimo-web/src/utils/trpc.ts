import type { AppRouter } from "@daimo/api";
import { httpBatchLink, createTRPCProxyClient } from "@trpc/client";

import { chainConfig } from "../env";

const apiUrl = process.env.DAIMO_APP_API_URL || "http://localhost:3000";
const apiUrlWithChain = `${apiUrl}/chain/${chainConfig.chainL2.id}`;

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({ url: apiUrlWithChain })],
});
