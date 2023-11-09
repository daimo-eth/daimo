import { createRouter } from "./router";

export type { AccountHistoryResult } from "./api/getAccountHistory";
export type { TokenBalance } from "./api/bridge";

export type AppRouter = ReturnType<typeof createRouter>;
