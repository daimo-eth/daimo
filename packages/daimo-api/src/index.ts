import { createRouter } from "./router";

export * from "./model";

export * from "./daimoLink";

export type AppRouter = ReturnType<typeof createRouter>;
