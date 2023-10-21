import { chainConfig } from "@daimo/contract";
import { nativeApplicationVersion, nativeBuildVersion } from "expo-application";

const apiUrl = process.env.DAIMO_APP_API_URL || "http://nibnalin.local:3000";
const apiUrlWithChain = `${apiUrl}/chain/${chainConfig.chainL2.id}`;

export const env = {
  apiUrl: apiUrlWithChain,
  buildProfile: process.env.EAS_BUILD_PROFILE || "local",
  gitHash: (process.env.EAS_BUILD_GIT_COMMIT_HASH || "unknown").substring(0, 8),
  nativeApplicationVersion,
  nativeBuildVersion,
};

console.log(`[APP] environment ${JSON.stringify(env, null, 2)}`);
