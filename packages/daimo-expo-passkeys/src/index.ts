import {
  NativeModulesProxy,
  EventEmitter,
  Subscription,
} from "expo-modules-core";

// Import the native module. On web, it will be resolved to ExpoPasskeys.web.ts
// and on native platforms to ExpoPasskeys.ts
import ExpoPasskeysModule from "./ExpoPasskeysModule";

export async function createPasskey(
  accountName: string,
  challengeBase64: string
): Promise<any> {
  return ExpoPasskeysModule.createPasskey(accountName, challengeBase64);
}

export async function signWithPasskey(challengeBase64: string): Promise<any> {
  return ExpoPasskeysModule.signWithPasskey(challengeBase64);
}
