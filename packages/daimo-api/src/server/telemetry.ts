import { trace } from "@opentelemetry/api";
import geoIP from "geoip-lite";
// @ts-ignore - add once @types/libhoney PR ships
import Libhoney from "libhoney";
import z from "zod";

import { TrpcRequestContext } from "./trpc";
import { chainConfig, getEnvApi } from "../env";

// More keys to come. This list ensures we don't duplicate columns.
export type TelemKey =
  | "ts"
  | "duration_ms"
  | "status_code"
  | "trace.trace_id"
  | "service.name"
  | "action.name"
  | "action.account_name"
  | "rpc.path"
  | "rpc.ip_addr"
  | "rpc.ip_country"
  | "rpc.user_agent";

export const zUserAction = z.object({
  name: z.string(),
  accountName: z.string(),
  keys: z.record(z.string()),
});

export type UserAction = z.infer<typeof zUserAction>;

/**
 * Server-side API telemetry.
 * - Track and improve reliability and performance.
 * - Track basic usage and adoption.
 *
 * We create two Honeycomb datasets:
 * - daimo-api for automatic instrumentation. Granalar, uses spans.
 * - daimo-events for manually recorded events.
 *
 * Manually recorded spans don't work.
 */
export class Telemetry {
  private honeyEvents: Libhoney | null;
  private tracerApi = trace.getTracer("daimo-api");

  constructor() {
    const apiKey = getEnvApi().HONEYCOMB_API_KEY;
    const sentryDSN = getEnvApi().SENTRY_DSN;
    if (apiKey === "") {
      console.log(`[TELEM] no HONEYCOMB_API_KEY set, telemetry disabled`);
      this.honeyEvents = null;
    } else {
      this.honeyEvents = new Libhoney({
        writeKey: apiKey,
        dataset: "daimo-events",
        sampleRate: 1,
      });
    }

    if (sentryDSN === "") {
      console.log(`[TELEM] no SENTRY_DSN set, Sentry error reports disabled`);
    }
    // else {
    //   Sentry.init({
    //     dsn: sentryDSN,
    //     // Don't send API server "not ready" errors to Sentry.
    //     ignoreErrors: ["API not ready"],
    //     integrations: [
    //       new Sentry.Integrations.Postgres(),
    //       nodeProfilingIntegration(),
    //     ],
    //     tracesSampleRate: 1.0,
    //     profilesSampleRate: 1.0,
    //   });
    // }
  }

  startApiSpan(ctx: TrpcRequestContext, type: string, path: string) {
    const span = this.tracerApi.startSpan(`trpc.${type}`);
    const ipCountry = getIpCountry(ctx.ipAddr);
    const requestInfo = {
      "rpc.path": path,
      "rpc.ip_addr": ctx.ipAddr,
      "rpc.ip_country": ipCountry,
      "rpc.user_agent": ctx.userAgent,
      "app.platform": ctx.daimoPlatform,
      "app.version": ctx.daimoVersion,
    };
    span.setAttributes(requestInfo);
    ctx.requestInfo = { ...ctx.requestInfo, ...requestInfo };
    return span;
  }

  recordUserAction(ctx: TrpcRequestContext, action: UserAction) {
    console.log(`[TELEM] recording ${action.name} ${action.accountName}`);

    const { ipAddr, userAgent } = ctx;
    const ipCountry = getIpCountry(ipAddr);

    this.honeyEvents?.sendNow({
      "service.name": "daimo-api",
      "event.type": "user-action",
      "event.account_name": action.accountName,
      "event.name": action.name,
      ...action.keys,

      "rpc.ip_addr": ipAddr,
      "rpc.ip_country": ipCountry,
      "rpc.user_agent": userAgent,
    });

    const keysJson = JSON.stringify(action.keys);
    this.recordClippy(
      `${action.accountName} from ${ipCountry}: ${action.name} ${keysJson}`,
      "info"
    );
  }

  /** Clippy is our Slack bot for API monitoring. */
  recordClippy(
    message: string,
    level: "info" | "warn" | "error" | "celebrate" = "info"
  ) {
    const levelEmoji = {
      info: "",
      warn: ":warning:",
      error: ":x:",
      celebrate: ":tada:",
    }[level];
    const fullMessage = `[${chainConfig.chainL2.name}]${levelEmoji} ${message}`;

    this.recordClippyRichMessage(fullMessage, []);
  }

  /** Use blocks for rich text. Markdown, etc. */
  recordClippyRichMessage(message: string, blocks: any[]) {
    const url = getEnvApi().CLIPPY_WEBHOOK_URL;

    console.log(`[TELEM] ${url === "" ? "SKIPPING " : ""}clippy: ${message}`);
    if (url === "") return;

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message, blocks }),
    });
  }
}

function getIpCountry(ipAddr: string) {
  const ipGeo = geoIP.lookup(ipAddr);
  return ipGeo?.country || "Unknown";
}
