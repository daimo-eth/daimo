import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@daimo/api";

export const trpc = createTRPCReact<AppRouter>();
