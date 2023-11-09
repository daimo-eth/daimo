import { Span } from "@opentelemetry/api";
import { initTRPC } from "@trpc/server";
import { CreateHTTPContextOptions } from "@trpc/server/adapters/standalone";

export type TrpcRequestContext = Awaited<ReturnType<typeof createContext>>;

/** Request context */
export const createContext = async (opts: CreateHTTPContextOptions) => {
  const ipAddr = getXForwardedIP(opts) || opts.req.socket.remoteAddress || "";
  const userAgent = opts.req.headers["user-agent"] || "";
  const daimoPlatform = opts.req.headers["x-daimo-platform"] || "";
  const daimoVersion = opts.req.headers["x-daimo-version"] || "";
  const span = null as Span | null;

  return { ipAddr, userAgent, daimoPlatform, daimoVersion, span, ...opts };
};

function getXForwardedIP(opts: CreateHTTPContextOptions) {
  let xForwardedFor = opts.req.headers["x-forwarded-for"];
  if (xForwardedFor == null) return null;
  if (Array.isArray(xForwardedFor)) xForwardedFor = xForwardedFor[0];
  return xForwardedFor.split(",")[0];
}

/**
 * Initialization of tRPC backend
 */
export const trpcT = initTRPC.context<typeof createContext>().create();
