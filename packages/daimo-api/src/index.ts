import { createRouter } from "./server/router";

export type { AccountHistoryResult } from "./api/getAccountHistory";

export type AppRouter = ReturnType<typeof createRouter>;
