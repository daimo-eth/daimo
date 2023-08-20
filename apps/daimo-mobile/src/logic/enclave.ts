import { assert } from "@daimo/common";
import * as ExpoEnclave from "@daimo/expo-enclave";
import { useEffect, useState } from "react";
import { Hex } from "viem";

import { Log } from "./log";
import { rpcHook } from "./trpc";
import { Account, defaultEnclaveKeyName } from "../model/account";

/** Loads an existing public key from the hardware enclave. */
export function useLoadKeyFromEnclave(enclaveKeyName = defaultEnclaveKeyName) {
  assert(enclaveKeyName.length > 0);

  const [pubKey, setPubKey] = useState<string>();

  useEffect(() => {
    loadEnclaveKey(enclaveKeyName).then(setPubKey);
  }, [enclaveKeyName]);

  return pubKey == null ? pubKey : (`0x${pubKey}` as Hex);
}

/** Looks up a Daimo account, given a public signing key. Null = none found. */
export function useLoadAccountFromKey(pubKey: Hex | undefined) {
  const [account, setAccount] = useState<Account | null>();

  const pubKeyHex = pubKey || "0x";
  const enabled = pubKey != null;
  const res = rpcHook.lookupAccountByKey.useQuery({ pubKeyHex }, { enabled });

  useEffect(() => {
    if (!res.isSuccess) return;
    if (account !== undefined) return;

    // No account found for this signing key
    if (!res.data) {
      setAccount(null);
      return;
    }

    // Account found
    const { name, addr } = res.data;

    console.log(`[ENCLAVE] loaded account ${name} from enclave key ${pubKey}`);
    setAccount({
      name,
      enclaveKeyName: defaultEnclaveKeyName,
      address: addr,

      lastBalance: 0n,
      lastBlockTimestamp: 0,
      lastBlock: 0,
      lastFinalizedBlock: 0,

      namedAccounts: [],
      recentTransfers: [],
      trackedRequests: [],

      pushToken: null,
    });
  }, [res.isSuccess, res.data]);

  return account;
}

/** Create a new key in the secure enclave. */
export async function createEnclaveKey(enclaveKeyName: string) {
  const [pubKey, hwSecLevel] = await Log.promise(
    "createEnclaveKey",
    Promise.all([
      ExpoEnclave.createKeyPair(enclaveKeyName),
      ExpoEnclave.getHardwareSecurityLevel(),
    ])
  );
  const pubKeyHex = `0x${pubKey}` as Hex;

  console.log(`[ENCLAVE] created ${enclaveKeyName} = ${pubKeyHex}`);

  return { enclaveKeyName, pubKeyHex, hwSecLevel };
}

/**
 * Fetches public key from enclave, or from cache for speed.
 *
 * Fetching from the enclave takes ~1 second on iPhone 13 Mini & iOS simulator.
 */
async function loadEnclaveKey(enclaveKeyName: string) {
  const ret = await Log.promise(
    "ExpoEnclave.fetchPublicKey",
    ExpoEnclave.fetchPublicKey(enclaveKeyName)
  );
  console.log(`[ENCLAVE] loaded ${enclaveKeyName} = ${ret}`);
  return ret;
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
