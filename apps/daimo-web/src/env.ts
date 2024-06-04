import { getEnvVars } from "@daimo/common";
import { getChainConfig } from "@daimo/contract";
import { z } from "zod";

export const envVarsWeb = getEnvVars(
  {
    NEXT_PUBLIC_DAIMO_CHAIN: z.enum(["base", "baseSepolia"]),
    NEXT_PUBLIC_DAIMO_API_URL: z.string(),
    NEXT_PUBLIC_DOMAIN: z.string(),
    NEXT_PUBLIC_URL: z.string().optional(),
    VERCEL_URL: z.string().optional(),
  },
  // We can't simply pass process.env, because Next string-replaces
  // "process.env.NEXT_PUBLIC_XYZ" with values at bundle time...
  {
    NEXT_PUBLIC_DAIMO_CHAIN: process.env.NEXT_PUBLIC_DAIMO_CHAIN,
    NEXT_PUBLIC_DAIMO_API_URL: process.env.NEXT_PUBLIC_DAIMO_API_URL,
    NEXT_PUBLIC_DOMAIN: process.env.NEXT_PUBLIC_DOMAIN,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    VERCEL_URL: process.env.VERCEL_URL,
  }
);

console.log(`[ENV] envVarsWeb: ${JSON.stringify(envVarsWeb)}`);

// || prevents build failures during CI
export const chainConfig = getChainConfig(envVarsWeb.NEXT_PUBLIC_DAIMO_CHAIN);
