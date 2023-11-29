import { createRouter } from "./server/router";

export type {
  AccountHistoryResult,
  SuggestedAction,
} from "./api/getAccountHistory";

export type { UserAction } from "./server/telemetry";

export type AppRouter = ReturnType<typeof createRouter>;
