import { createTRPCReact } from "@trpc/react-query";

// TODO: import as "daimo-api" with package linking
import type { AppRouter } from "../../../daimo-api/src";

export const trpc = createTRPCReact<AppRouter>();
