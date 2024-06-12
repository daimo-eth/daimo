import { getEnvVars } from "@daimo/common";
import { getChainConfig } from "@daimo/contract";
import { z } from "zod";

export const envVarsWeb = getEnvVars(
  {
    NEXT_PUBLIC_DAIMO_CHAIN: z.enum(["base", "baseSepolia"]),
    // Daimo API URL. Example: https://api.daimo.xyz
    NEXT_PUBLIC_DAIMO_API_URL: z.string(),
    // Base URL for image previews & shareable links. Example: https://daimo.com
    NEXT_PUBLIC_URL: z.string(),
    // Used by Invite Frame to create invite links. Backend only.
    DAIMO_API_KEY: z.string().optional(),
    // Used by Invite Frame to check user info. Backend only.
    DAIMO_NEYNAR_KEY: z.string().optional(),
  },
  // We can't simply pass process.env, because Next string-replaces
  // "process.env.NEXT_PUBLIC_XYZ" with values at bundle time...
  {
    NEXT_PUBLIC_DAIMO_CHAIN: process.env.NEXT_PUBLIC_DAIMO_CHAIN,
    NEXT_PUBLIC_DAIMO_API_URL: process.env.NEXT_PUBLIC_DAIMO_API_URL,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    DAIMO_API_KEY: process.env.DAIMO_API_KEY,
    DAIMO_NEYNAR_KEY: process.env.DAIMO_NEYNAR_KEY,
  }
);

console.log(`[ENV] envVarsWeb: ${JSON.stringify(envVarsWeb)}`);

// || prevents build failures during CI
export const chainConfig = getChainConfig(envVarsWeb.NEXT_PUBLIC_DAIMO_CHAIN);
