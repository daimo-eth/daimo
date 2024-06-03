import type { AppRouter } from "@daimo/api";
import { DaimoChain, getChainConfig } from "@daimo/contract";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";

export const chainConfig = getChainConfig(
  (process.env.DAIMO_CHAIN || "baseSepolia") as DaimoChain,
);

const apiUrl = process.env.DAIMO_API_URL || "http://localhost:3000";
export const apiUrlWithChain = `${apiUrl}/chain/${chainConfig.chainL2.id}`;

export const rpc = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({ url: apiUrlWithChain })],
});
