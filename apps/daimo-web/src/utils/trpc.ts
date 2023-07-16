import type { AppRouter } from "@daimo/api";
import { httpBatchLink, createTRPCProxyClient } from "@trpc/client";

const apiUrl = process.env.DAIMO_APP_API_URL || "http://localhost:3000";

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({ url: apiUrl })],
});
