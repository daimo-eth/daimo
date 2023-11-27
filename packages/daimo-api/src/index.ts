import { createRouter } from "./server/router";

export type {
  AccountHistoryResult,
  SuggestedAction,
} from "./api/getAccountHistory";

export type AppRouter = ReturnType<typeof createRouter>;
