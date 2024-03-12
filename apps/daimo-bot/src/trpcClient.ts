import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@daimo/api";

const BASE_CHAIN_ID = "8453";
const BASE_SEPOLIA_CHAIN_ID = "84532";
const URL_CHAIN_MAPPING = {
  mainnet: {
    url: process.env.DAIMO_APP_API_URL_MAINNET,
    chainId: BASE_CHAIN_ID,
  },
  testnet: {
    url: process.env.DAIMO_APP_API_URL_TESTNET,
    chainId: BASE_SEPOLIA_CHAIN_ID,
  },
  default: {
    url: "http://localhost:3000",
    chainId: BASE_SEPOLIA_CHAIN_ID,
  },
} as const;

const getApiUrl = () => {
  const key: keyof typeof URL_CHAIN_MAPPING = process.env
    .DAIMO_APP_API_URL_MAINNET
    ? "mainnet"
    : process.env.DAIMO_APP_API_URL_TESTNET
    ? "testnet"
    : "default";

  const { url, chainId } = URL_CHAIN_MAPPING[key];
  return `${url}/chain/${chainId}`;
};

console.log(`[TRPC] connecting to ${getApiUrl()}`);
// @ts-expect-error: non-blocking AppRouter TypeError. types still populate
export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: getApiUrl(),
    }),
  ],
});
