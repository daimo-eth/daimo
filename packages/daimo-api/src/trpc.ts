import { initTRPC } from "@trpc/server";

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.create();

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;

const timerMiddleware = t.middleware(async (opts) => {
  const start = performance.now();
  const result = await opts.next();
  const durationMs = performance.now() - start;
  console.log(`[TRPC] ${opts.type} ${opts.path} took ${durationMs}ms`);

  return result;
});

export const publicProcedure = t.procedure;
export const timedProcedure = publicProcedure.use(timerMiddleware);
