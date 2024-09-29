import { Span } from "@opentelemetry/api";
import { TRPCError, initTRPC } from "@trpc/server";
import { CreateHTTPContextOptions } from "@trpc/server/adapters/standalone";

import { Telemetry } from "./telemetry";

export type TrpcRequestContext = Awaited<ReturnType<typeof createContext>>;

/** Request context */
export const createContext = async (opts: CreateHTTPContextOptions) => {
  const ipAddr = getXForwardedIP(opts) || opts.req.socket.remoteAddress || "";
  const userAgent = getHeader(opts.req.headers["user-agent"]);
  const daimoPlatform = getHeader(opts.req.headers["x-daimo-platform"]);
  const daimoVersion = getHeader(opts.req.headers["x-daimo-version"]);
  const span = null as Span | null;
  const requestInfo = {} as any;

  return {
    ipAddr,
    userAgent,
    daimoPlatform,
    daimoVersion,
    span,
    requestInfo,
    ...opts,
  };
};

function getHeader(h: string | string[] | undefined) {
  if (Array.isArray(h)) return h[0];
  else return h || "";
}

export function onTrpcError(telemetry: Telemetry) {
  return ({ error, ctx }: { error: TRPCError; ctx?: TrpcRequestContext }) => {
    const err = `${error.code} ${error.name} ${error.message}`;
    let reqStr = "unknown req";
    if (ctx != null) {
      ctx.span?.setAttribute("rpc.error", err);
      reqStr = `${ctx.req.method} ${ctx.req.url}`; // eg. "GET [...]/search"
    }
    if (error.code === "PRECONDITION_FAILED") {
      console.log(`[API] NOT READY, skipping ${reqStr}`);
    } else if (error.code === "UNAUTHORIZED") {
      console.log(`[API] UNAUTHORIZED, skipping ${reqStr}`);
    } else {
      console.error(`[API] ${reqStr}`, error);

      // Log to Slack
      try {
        telemetry.recordClippy(`TRPC Error ${reqStr}: ${err}`, "error");
      } catch (e) {
        console.error("Telemetry error", e);
      }
    }
  };
}

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
