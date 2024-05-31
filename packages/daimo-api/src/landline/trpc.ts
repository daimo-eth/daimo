import { createTRPCClient, httpBatchLink } from "@trpc/client";

// TODO(andrew): move to env variables
const LANDLINE_API_URL = "http://localhost:4000";
const LANDLINE_API_KEY = "asdf";

const createHeaders = () => {
  const headers: Record<string, string> = {
    "x-api-key": LANDLINE_API_KEY,
  };

  return headers;
};

// TODO(andrew): Add type to createTRPCClient
export const landlineTrpc = createTRPCClient({
  links: [
    httpBatchLink({
      url: LANDLINE_API_URL,
      headers: createHeaders(),
    }),
  ],
});
