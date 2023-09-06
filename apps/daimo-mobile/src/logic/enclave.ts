import * as ExpoEnclave from "@daimo/expo-enclave";
import { Hex } from "viem";

import { Log } from "./log";

export async function forceWeakerKeyUsage() {
  await Log.promise("forceFallbackUsage", ExpoEnclave.forceFallbackUsage());
  console.log(`[ENCLAVE] forceFallbackUsage done`);
}

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

export interface EnclaveSecSummary {
  biometricSecurityLevel: ExpoEnclave.BiometricSecurityLevel;
  hardwareSecurityLevel: ExpoEnclave.HardwareSecurityLevel;
}

/** Gets detailed enclave security level */
export async function getEnclaveSec(): Promise<EnclaveSecSummary> {
  const promises = [
    ExpoEnclave.getBiometricSecurityLevel(),
    ExpoEnclave.getHardwareSecurityLevel(),
  ] as const;
  const results = await Promise.all(promises);
  return {
    biometricSecurityLevel: results[0],
    hardwareSecurityLevel: results[1],
  };
}
