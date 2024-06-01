import { createTRPCClient, httpBatchLink } from "@trpc/client";

const createHeaders = () => {
  const headers: Record<string, string> = {
    "x-api-key": process.env.LANDLINE_API_KEY || "",
  };

  return headers;
};

// TODO(andrew): Add type to createTRPCClient
export const landlineTrpc = createTRPCClient({
  links: [
    httpBatchLink({
      url: process.env.LANDLINE_API_URL || "",
      headers: createHeaders(),
    }),
  ],
});
