import { createTRPCClient, httpBatchLink } from "@trpc/client";

import { getEnvApi } from "../env";
import { TrpcRequestContext } from "../server/trpc";

const env = getEnvApi();

// TODO(andrew): Add type to createTRPCClient
export const landlineTrpc = createTRPCClient({
  links: [
    httpBatchLink({
      url: process.env.LANDLINE_API_URL || "",
      headers: (o) => {
        const context = o.opList[0].context as TrpcRequestContext;
        return {
          "x-api-key": env.LANDLINE_API_KEY,
          "x-forwarded-for": context.ipAddr,
        };
      },
    }),
  ],
});
