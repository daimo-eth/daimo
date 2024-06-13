import { AppRouter } from "@daimo/api";
import { createTRPCClient, httpBatchLink } from "@trpc/client";

import { chainConfig, envVarsWeb } from "../env";

const apiUrl = envVarsWeb.NEXT_PUBLIC_DAIMO_API_URL;
export const apiUrlWithChain = `${apiUrl}/chain/${chainConfig.chainL2.id}`;

export const rpc = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: apiUrlWithChain })],
});
