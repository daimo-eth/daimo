import * as ExpoEnclave from "@daimo/expo-enclave";
import { Hex } from "viem";

import { Log } from "./log";

/** Create a new key in the secure enclave. */
export async function createEnclaveKey(enclaveKeyName: string) {
  const pubKey = await Log.promise(
    "createEnclaveKey",
    ExpoEnclave.createKeyPair(enclaveKeyName)
  );
  const pubKeyHex = `0x${pubKey}` as Hex;

  console.log(`[ENCLAVE] created ${enclaveKeyName} = ${pubKeyHex}`);

  return pubKeyHex;
}

/**
 * Fetches public key from enclave, or from cache for speed.
 *
 * Fetching from the enclave takes ~1 second on iPhone 13 Mini & iOS simulator?
 * Nalin: Does it? Seems like few ms for me.
 */
export async function loadEnclaveKey(enclaveKeyName: string) {
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
  await Log.promise(
    "ExpoEnclave.deleteKeyPair",
    ExpoEnclave.deleteKeyPair(enclaveKeyName)
  );
  console.log(`[ENCLAVE] deleted ${enclaveKeyName}`);
}

/** Get hardware security level */
export async function getHardwareSec(): Promise<ExpoEnclave.HardwareSecurityLevel> {
  const result = await Log.promise(
    "getHardwareSec",
    ExpoEnclave.getHardwareSecurityLevel()
  );
  return result;
}
