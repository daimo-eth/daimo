import * as ExpoEnclave from "@daimo/expo-enclave";
import { Hex } from "viem";

import { Log } from "./log";

export interface EnclaveKeyInfo {
  hwSecLevel: ExpoEnclave.HardwareSecurityLevel;
  enclaveKeyName: string;
  pubKeyHex?: Hex;
}

// Returns a public key, plus the security level of the key.
export async function loadOrCreateEnclaveKey(
  keyName: string
): Promise<EnclaveKeyInfo> {
  let keyInfo = await loadEnclaveKey(keyName);

  console.log(`[ACTION] loaded key info ${JSON.stringify(keyInfo)}`);
  if (keyInfo.pubKeyHex != null) return keyInfo;

  const newPublicKey = await createEnclaveKey(keyName);
  const { hwSecLevel, enclaveKeyName } = keyInfo;
  keyInfo = { hwSecLevel, enclaveKeyName, pubKeyHex: newPublicKey };
  console.log(`[ACTION] created key info ${JSON.stringify(keyInfo)}`);
  return keyInfo;
}

/** Create a new key in the secure enclave. */
async function createEnclaveKey(enclaveKeyName: string) {
  const pubKey = await Log.promise(
    "createEnclaveKey",
    ExpoEnclave.createKeyPair(enclaveKeyName)
  );
  const pubKeyHex = `0x${pubKey}` as Hex;

  console.log(`[ENCLAVE] created ${enclaveKeyName} = ${pubKeyHex}`);

  return pubKeyHex;
}

/** Fetches device pubkey, plus security level, from the secure enclave. */
export async function loadEnclaveKey(
  enclaveKeyName: string
): Promise<EnclaveKeyInfo> {
  const [ret, hwSecLevel] = await Log.promise(
    "loadEnclaveKey",
    Promise.all([
      ExpoEnclave.fetchPublicKey(enclaveKeyName),
      ExpoEnclave.getHardwareSecurityLevel(),
    ])
  );

  console.log(`[ENCLAVE] loaded ${enclaveKeyName} = ${ret}`);
  return {
    enclaveKeyName,
    pubKeyHex: !ret ? undefined : (`0x${ret}` as Hex),
    hwSecLevel,
  };
}

/** Deletes a key from the enclave. */
export async function deleteEnclaveKey(enclaveKeyName: string) {
  console.log(`[ENCLAVE] deleting key ${enclaveKeyName}`);
  await Log.promise(
    "ExpoEnclave.deleteKeyPair",
    ExpoEnclave.deleteKeyPair(enclaveKeyName)
  );
  console.log(`[ENCLAVE] deleted key ${enclaveKeyName}`);
}

/** Get hardware security level */
export async function getHardwareSec(): Promise<ExpoEnclave.HardwareSecurityLevel> {
  const result = await Log.promise(
    "getHardwareSec",
    ExpoEnclave.getHardwareSecurityLevel()
  );
  return result;
}
