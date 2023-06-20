import { createRouter } from "./router";

export * from "./model";

export type AppRouter = ReturnType<typeof createRouter>;
