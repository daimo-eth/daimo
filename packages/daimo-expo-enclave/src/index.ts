// Import the native module. On web, it will be resolved to ExpoEnclave.web.ts
// and on native platforms to ExpoEnclave.ts
import ExpoEnclaveModule from "./ExpoEnclaveModule";

export type HardwareSecurityLevel =
  | "SOFTWARE"
  | "TRUSTED_ENVIRONMENT"
  | "HARDWARE_ENCLAVE";

export type PromptCopy = {
  /**
   * Message displayed when prompting for authentication,
   * rendered on both iOS and Android devices.
   */
  usageMessage: string;

  /**
   * Title of the auth prompt, only rendered on Android
   * devices.
   */
  androidTitle: string;
};

/**
 * Get key storage security level.
 * @return HardwareSecurityLevel
 */
export async function getHardwareSecurityLevel(): Promise<HardwareSecurityLevel> {
  return ExpoEnclaveModule.getHardwareSecurityLevel();
}

/**
 * Fetch public key (DER representation) of key pair attached to accountName.
 *
 * @param accountName The account name to fetch the public key for.
 * @return Hex string of DER representation of the public key, or undefined if
 * no key pair is attached to accountName.
 */
export async function fetchPublicKey(
  accountName: string
): Promise<string | undefined> {
  return ExpoEnclaveModule.fetchPublicKey(accountName);
}

/**
 * Create a new key pair and attach it to accountName.
 *
 * @param accountName The account name to attach the key pair to.
 * @return Hex string of DER representation of the public key
 */
export async function createKeyPair(accountName: string): Promise<string> {
  return ExpoEnclaveModule.createKeyPair(accountName);
}

/**
 * Delete the key pair associated with accountName.
 *
 * @param accountName The account name to remove.
 */
export async function deleteKeyPair(accountName: string): Promise<void> {
  return ExpoEnclaveModule.deleteKeyPair(accountName);
}

/**
 * Sign a message using the key pair attached to accountName.
 *
 * @param accountName The account to use.
 * @param hexMessage Hex string of the message bytes to sign.
 * @param promptCopy Message to display when prompting for auth.
 * @return Hex string of DER representation of the signature
 */
export async function sign(
  accountName: string,
  hexMessage: string,
  promptCopy: PromptCopy
): Promise<string> {
  return ExpoEnclaveModule.sign(accountName, hexMessage, promptCopy);
}

/**
 * Verify a signature using the key pair attached to accountName.
 *
 * @param accountName The account to use.
 * @param hexSignature Hex string of the DER representation of the
 * signature to verify.
 * @param hexMessage Hex string of the message bytes signed.
 * @return boolean
 */
export async function verify(
  accountName: string,
  hexSignature: string,
  hexMessage: string
): Promise<boolean> {
  return ExpoEnclaveModule.verify(accountName, hexSignature, hexMessage);
}
