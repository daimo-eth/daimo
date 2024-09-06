import { Span } from "@opentelemetry/api";
import { TRPCError, initTRPC } from "@trpc/server";
import { CreateHTTPContextOptions } from "@trpc/server/adapters/standalone";
import { CreateWSSContextFnOptions } from "@trpc/server/adapters/ws";

import { Telemetry } from "./telemetry";

export type TrpcRequestContext = Awaited<ReturnType<typeof createContext>>;

/** Request context */
export const createContext = async (
  opts: CreateHTTPContextOptions | CreateWSSContextFnOptions
) => {
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

export type DaimoVersion = {
  appVersion: { major: number; minor: number; patch: number } | null;
  buildVersion: number | null;
};

export function parseDaimoVersion(v: string | undefined): DaimoVersion {
  if (v == null) {
    return { appVersion: null, buildVersion: null };
  }

  // Parse version string in format "1.2.3 #456"
  const parts = v.split(" #");
  if (parts.length !== 2) {
    return { appVersion: null, buildVersion: null };
  }

  const [applicationVersion, buildVersion] = parts;

  // Parse application version (e.g., "1.2.3")
  const appVersionParts = applicationVersion.split(".").map(Number);
  const parsedAppVersion =
    appVersionParts.length === 3 && appVersionParts.every(Number.isInteger)
      ? {
          major: appVersionParts[0],
          minor: appVersionParts[1],
          patch: appVersionParts[2],
        }
      : null;

  // Parse build version (e.g., "456")
  const parsedBuildVersion = Number.isInteger(Number(buildVersion))
    ? Number(buildVersion)
    : null;

  return {
    appVersion: parsedAppVersion,
    buildVersion: parsedBuildVersion,
  };
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

function getXForwardedIP(
  opts: CreateHTTPContextOptions | CreateWSSContextFnOptions
) {
  let xForwardedFor = opts.req.headers["x-forwarded-for"];
  if (xForwardedFor == null) return null;
  if (Array.isArray(xForwardedFor)) xForwardedFor = xForwardedFor[0];
  return xForwardedFor.split(",")[0];
}

/**
 * Initialization of tRPC backend
 */
export const trpcT = initTRPC.context<typeof createContext>().create();
