import { initTRPC } from "@trpc/server";
import { CreateHTTPContextOptions } from "@trpc/server/adapters/standalone";

export type TrpcRequestContext = Awaited<ReturnType<typeof createContext>>;

/** Request context */
export const createContext = async (opts: CreateHTTPContextOptions) => {
  const ipAddrOrArr =
    opts.req.headers["x-forwarded-for"] || opts.req.socket.remoteAddress || "";
  const ipAddr = Array.isArray(ipAddrOrArr) ? ipAddrOrArr[0] : ipAddrOrArr;
  const userAgent = opts.req.headers["user-agent"] || "";
  return { ipAddr, userAgent };
};

/**
 * Initialization of tRPC backend
 */
export const trpcT = initTRPC.context<typeof createContext>().create();
