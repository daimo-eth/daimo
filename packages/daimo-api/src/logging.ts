import { AsyncLocalStorage } from "node:async_hooks";

// Log context
const logContext = new AsyncLocalStorage<string>();

// Set log context, eg `req:abcd1234` to identify an API request.
export function runWithLogContext<T>(context: string, fn: () => T) {
  return logContext.run(context, fn);
}

// Log context, like which TRPC request we're serving, on every console.log
export function initLogging() {
  function addContext(logFn: (msg: string, ...params: any[]) => void) {
    return (msg: string, ...params: any[]) => {
      const context = logContext.getStore();
      if (context) logFn(`[${context}] ${msg}`, ...params);
      else log(msg, ...params);
    };
  }

  const { log, warn, error } = console;
  console.log = addContext(log);
  console.warn = addContext(warn);
  console.error = addContext(error);
}
