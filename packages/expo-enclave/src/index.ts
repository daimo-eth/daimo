// Import the native module. On web, it will be resolved to ExpoEnclave.web.ts
// and on native platforms to ExpoEnclave.ts
import ExpoEnclaveModule from "./ExpoEnclaveModule";

export function isSecureEnclaveAvailable(): boolean {
  return ExpoEnclaveModule.isSecureEnclaveAvailable();
}

export function fetchPublicKey(accountName: string): string | undefined {
  return ExpoEnclaveModule.fetchPublicKey(accountName);
}

export function createKeyPair(accountName: string): string {
  return ExpoEnclaveModule.createKeyPair(accountName);
}

export function sign(accountName: string, hexMessage: string): string {
  return ExpoEnclaveModule.sign(accountName, hexMessage);
}

export function verify(
  accountName: string,
  hexSignature: string,
  hexMessage: string
): boolean {
  return ExpoEnclaveModule.verify(accountName, hexSignature, hexMessage);
}
