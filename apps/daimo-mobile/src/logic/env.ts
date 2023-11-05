import { DaimoChain, getChainConfig } from "@daimo/contract";
import { nativeApplicationVersion, nativeBuildVersion } from "expo-application";

import { getRpcFunc, getRpcHook } from "./trpc";

const passkeyDomain = process.env.DAIMO_PASSKEY_DOMAIN || "daimo.com";

const buildEnv = {
  buildProfile: process.env.EAS_BUILD_PROFILE || "local",
  gitHash: (process.env.EAS_BUILD_GIT_COMMIT_HASH || "unknown").substring(0, 8),
  nativeApplicationVersion,
  nativeBuildVersion,
  passkeyDomain,
};

console.log(`[APP] build environment ${JSON.stringify(buildEnv, null, 2)}`);

export function env(daimoChain: DaimoChain) {
  const chainConfig = getChainConfig(daimoChain);
  return {
    ...buildEnv,
    chainConfig,
    rpcFunc: getRpcFunc(daimoChain),
    rpcHook: getRpcHook(daimoChain),
  };
}
