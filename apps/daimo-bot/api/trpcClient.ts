import type { AppRouter } from "@daimo/api";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";

const BASE_CHAIN_ID = "8453";
const BASE_SEPOLIA_CHAIN_ID = "84532";

function getEthApiConfig() {
  let url = process.env.DAIMO_APP_API_URL_MAINNET;
  if (url) return { url, chainId: BASE_CHAIN_ID };
  url = process.env.DAIMO_APP_API_URL_TESTNET || "http://localhost:3000";
  return { url, chainId: BASE_SEPOLIA_CHAIN_ID };
}

// @ts-expect-error: non-blocking AppRouter TypeError. types still populate
export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: getEthApiConfig().url,
    }),
  ],
});
