import { createRouter } from "./router";

export type { AccountHistoryResult } from "./api/getAccountHistory";

export type AppRouter = ReturnType<typeof createRouter>;
