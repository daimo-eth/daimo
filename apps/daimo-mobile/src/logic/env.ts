import { nativeApplicationVersion, nativeBuildVersion } from "expo-application";

export const env = {
  apiUrl: process.env.DAIMO_APP_API_URL || "http://localhost:3000",
  buildProfile: process.env.EAS_BUILD_PROFILE || "local",
  gitHash: (process.env.EAS_BUILD_GIT_COMMIT_HASH || "unknown").substring(0, 8),
  nativeApplicationVersion,
  nativeBuildVersion,
};

console.log(`[APP] environment ${JSON.stringify(env, null, 2)}`);