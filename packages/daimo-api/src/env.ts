import { getEnvVars } from "@daimo/common";
import { getChainConfig } from "@daimo/contract";
import dotenv from "dotenv";
import z, { ZodObject } from "zod";
dotenv.config();

// Enable JSON.stringify for BigInts
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const zEnv = {
  NEXT_PUBLIC_DAIMO_CHAIN: z.enum(["base", "baseSepolia"]),
  // App DB connection. Defaults to local Postgres.
  PGURL: z.string().startsWith("postgres://").optional(),
  // Shovel DB connection. Defaults to local Postgres.
  SHOVEL_DATABASE_URL: z.string().startsWith("postgres://").optional(),
  // Authorized API keys for service clients to grant invites, etc.
  DAIMO_ALLOWED_API_KEYS: z.string().optional(),
  // Currency exchange rates API: openexchangerates.org
  EXCHANGE_RATES_URL: z.string().startsWith("https://"),
  // Anti-spam faucet API URL
  DAIMO_FAUCET_API_URL: z.string().optional().default(""),
  DAIMO_FAUCET_API_KEY: z.string().optional().default(""),
  // ERC-4337 userop bundler. Used only for gas price estimation:
  // we submit [compressed] bundles ourselves.
  DAIMO_BUNDLER_RPC: z.string().startsWith("https://"),
  // Uniswap RPC, for any-chain swaps. Required on mainnet.
  // Use an independent HTTP RPC to work around Websocket bugs in Ethers,
  // and by extension the Uniswap SDK:
  // https://github.com/Uniswap/smart-order-router/issues/461
  // https://stackoverflow.com/q/77336570
  DAIMO_API_UNISWAP_RPC: z.string().startsWith("https://").optional(),
  // Ethereum L1 RPC, with comma-delimited fallbacks.
  DAIMO_API_L1_RPC_WS: z.string(),
  // Ethereum L2 RPC, with comma-delimited fallbacks.
  DAIMO_API_L2_RPC_WS: z.string(),
  // Deployer, compressed userop bundler, + faucet EOA private key.
  DAIMO_API_PRIVATE_KEY: z.string().optional().default(""),
  // Push notifications enabled? Should only be true in prod.
  DAIMO_PUSH_ENABLED: z
    .string()
    .optional()
    .transform((s) => s === "true"),
  // API operator internal notifications: Clippy, Slack bot
  CLIPPY_WEBHOOK_URL: z.string().optional().default(""),
  // Monitoring: Honeycomb
  HONEYCOMB_API_KEY: z.string().optional().default(""),
  // Monitoring: Sentry
  SENTRY_DSN: z.string().optional().default(""),
  // Landline integration
  LANDLINE_API_URL: z.string().optional().default(""),
  LANDLINE_API_KEY: z.string().optional().default(""),
  LANDLINE_WHITELIST_USERNAMES: z
    .string()
    .optional()
    .transform((s) => (s ? s.split(",") : [])),
};

let envVarsApi: z.infer<ZodObject<typeof zEnv>> | undefined;

export function getEnvApi() {
  if (envVarsApi == null) {
    envVarsApi = getEnvVars(zEnv);
    console.log(`[API] envVarsApi: ${JSON.stringify(envVarsApi)}`);
  }
  return envVarsApi;
}

export const chainConfig = getChainConfig(getEnvApi().NEXT_PUBLIC_DAIMO_CHAIN);
