import { getEnvVars } from "@daimo/common";
import { DaimoChain, getChainConfig } from "@daimo/contract";
import { nativeApplicationVersion, nativeBuildVersion } from "expo-application";
import { DeviceType, deviceType } from "expo-device";
import { ZodObject, z } from "zod";

const zEnv = {
  DAIMO_APP_VARIANT: z.enum(["sim", "maestro", "dev", "prod"]).default("sim"),
  // Useful for local testing against an alternate passkey domain
  DAIMO_PASSKEY_DOMAIN: z.string().default("daimo.com"),
  // Daimo API instance. Required if DAIMO_APP_API_URL is not set
  DAIMO_APP_API_URL_TESTNET: z.string().optional(),
  // Daimo API instance. Required if DAIMO_APP_API_URL is not set
  DAIMO_APP_API_URL_MAINNET: z.string().optional(),
  // Daimo API instance. Required if chain-specific API URLs are not set
  DAIMO_APP_API_URL: z.string().optional(),
  // Used only for Farcaster login / "Connect Farcaster"
  DAIMO_OPTIMISM_RPC_URL: z.string().default("https://mainnet.optimism.io"),
  // Set automatically by Expo
  EAS_BUILD_PROFILE: z.string().default("local"),
  // Set automatically by Expo
  EAS_BUILD_GIT_COMMIT_HASH: z.string().default("unknown"),
};

let envMobile: z.infer<ZodObject<typeof zEnv>> | undefined;

export function getEnvMobile() {
  if (envMobile == null) {
    envMobile = getEnvVars(zEnv, {
      // We can't s pass process.env because Metro string-replaces env vars.
      DAIMO_APP_VARIANT: process.env.DAIMO_APP_VARIANT,
      DAIMO_PASSKEY_DOMAIN: process.env.DAIMO_PASSKEY_DOMAIN,
      DAIMO_APP_API_URL_TESTNET: process.env.DAIMO_APP_API_URL_TESTNET,
      DAIMO_APP_API_URL_MAINNET: process.env.DAIMO_APP_API_URL_MAINNET,
      DAIMO_APP_API_URL: process.env.DAIMO_APP_API_URL,
      DAIMO_OPTIMISM_RPC_URL: process.env.DAIMO_OPTIMISM_RPC_URL,
      EAS_BUILD_PROFILE: process.env.EAS_BUILD_PROFILE,
      EAS_BUILD_GIT_COMMIT_HASH: process.env.EAS_BUILD_GIT_COMMIT_HASH,
    });
    console.log(`[APP] envMobile ${JSON.stringify(envMobile)}`);
  }
  return envMobile;
}

const buildEnv = {
  buildProfile: getEnvMobile().EAS_BUILD_PROFILE,
  gitHash: getEnvMobile().EAS_BUILD_GIT_COMMIT_HASH.substring(0, 8),
  passkeyDomain: getEnvMobile().DAIMO_PASSKEY_DOMAIN,
  nativeApplicationVersion,
  nativeBuildVersion,
};

console.log(`[APP] build environment ${JSON.stringify(buildEnv, null, 2)}`);

function getDeviceType(): "computer" | "phone" {
  switch (deviceType) {
    case DeviceType.DESKTOP:
      return "computer";
    case DeviceType.PHONE:
    case DeviceType.TABLET:
    default:
      return "phone";
  }
}

export function env(daimoChain: DaimoChain) {
  const chainConfig = getChainConfig(daimoChain);
  return {
    ...buildEnv,
    deviceType: getDeviceType(),
    chainConfig,
  };
}
