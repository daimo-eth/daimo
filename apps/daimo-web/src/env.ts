import { getEnvVars } from "@daimo/common";
import { getChainConfig } from "@daimo/contract";
import { z } from "zod";

export const envVarsWeb = getEnvVars(
  z.object({
    NEXT_PUBLIC_DAIMO_CHAIN: z.enum(["base", "baseSepolia"]),
    NEXT_PUBLIC_DAIMO_API_URL: z.string(),
    NEXT_PUBLIC_DOMAIN: z.string(),
    NEXT_PUBLIC_URL: z.string().optional(),
    VERCEL_URL: z.string().optional(),
  }),
);

console.log(`[ENV] envVarsWeb: ${JSON.stringify(envVarsWeb)}`);

// || prevents build failures during CI
export const chainConfig = getChainConfig(envVarsWeb.NEXT_PUBLIC_DAIMO_CHAIN);
