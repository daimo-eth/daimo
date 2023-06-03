// Import the native module. On web, it will be resolved to ExpoEnclave.web.ts
// and on native platforms to ExpoEnclave.ts
import ExpoEnclaveModule from "./ExpoEnclaveModule";

export type HardwareSecurityLevel =
  | "SOFTWARE"
  | "TRUSTED_ENVIRONMENT"
  | "STRONGBOX";

export type BiometricSecurityLevel = "NONE" | "AVAILABLE";

export async function getHardwareSecurityLevel(): Promise<HardwareSecurityLevel> {
  return ExpoEnclaveModule.getHardwareSecurityLevel();
}

export async function getBiometricSecurityLevel(): Promise<BiometricSecurityLevel> {
  return ExpoEnclaveModule.getBiometricSecurityLevel();
}

export async function fetchPublicKey(
  accountName: string
): Promise<string | undefined> {
  return ExpoEnclaveModule.fetchPublicKey(accountName);
}

export async function createKeyPair(accountName: string): Promise<string> {
  return ExpoEnclaveModule.createKeyPair(accountName);
}

export async function sign(
  accountName: string,
  hexMessage: string
): Promise<string> {
  return ExpoEnclaveModule.sign(accountName, hexMessage);
}

export async function verify(
  accountName: string,
  hexSignature: string,
  hexMessage: string
): Promise<boolean> {
  return ExpoEnclaveModule.verify(accountName, hexSignature, hexMessage);
}
