interface LogAction {
  type: string;
  startMs: number;
  elapsedMs: number;
  error?: string;
}

export class NamedError extends Error {
  constructor(message: string, public name: string) {
    super(message);

    // Set the prototype explicitly.
    // https://github.com/microsoft/TypeScript-wiki/blob/81fe7b91664de43c02ea209492ec1cea7f3661d0/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, NamedError.prototype);
  }
}

/**
 * Logging and telemetry. We'll use this in two ways:
 * - High-level, anonymized data (perf and reliability stats) telemetered.
 * - Detailed debug logs can be sent manually via Send Debug Logs.
 */
export class Log {
  static async promise<T>(type: string, promise: Promise<T>): Promise<T> {
    const startMs = Date.now();
    try {
      const ret = await promise;
      this.log({ type, startMs, elapsedMs: Date.now() - startMs });
      return ret;
    } catch (e: any) {
      const elapsedMs = Date.now() - startMs;
      this.log({ type, startMs, elapsedMs, error: getErrMessage(e) });
      throw new NamedError(getErrMessage(e), type);
    }
  }

  private static log(action: LogAction) {
    // TODO: save in local debug log
    // TODO: roll up per-type stats
    if (action.error) console.error(`[LOG] ${JSON.stringify(action)}`);
    else console.log(`[LOG] ${JSON.stringify(action)}`);
  }
}

/** Always returns a nonempty string, "unknown error" if missing. */
function getErrMessage(e: any): string {
  return typeof e === "string" ? e : e?.message || "unknown error";
}
