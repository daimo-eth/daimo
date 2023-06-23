import * as ExpoEnclave from "@daimo/expo-enclave";
import { useEffect, useState } from "react";
import { Hex } from "viem";

import { assert } from "./assert";
import { Log } from "./log";
import { rpcHook } from "./trpc";
import { Account, defaultEnclaveKeyName } from "../model/account";

/** Loads an existing public key from the hardware enclave. */
export function useLoadKeyFromEnclave(enclaveKeyName = defaultEnclaveKeyName) {
  assert(enclaveKeyName.length > 0);

  const [pubKey, setPubKey] = useState<string>();

  useEffect(() => {
    Log.promise(
      "enclaveFetchPublicKey",
      ExpoEnclave.fetchPublicKey(enclaveKeyName)
    ).then(setPubKey);
  }, [enclaveKeyName]);

  return pubKey == null ? pubKey : (`0x${pubKey}` as Hex);
}

/** Looks up a Daimo account, given a public signing key.  */
export function useLoadAccountFromKey(pubKey: Hex | undefined) {
  const [account, setAccount] = useState<Account>();

  const pubKeyHex = pubKey || "0x";
  const enabled = pubKey != null;
  const res = rpcHook.lookupAccountByKey.useQuery({ pubKeyHex }, { enabled });

  useEffect(() => {
    if (!res.isSuccess || !res.data) return;
    if (account) return;

    const { name, addr } = res.data;

    console.log(`[ACCOUNT] loaded account ${name} from enclave key ${pubKey}`);
    setAccount({
      name,
      address: addr,
      enclaveKeyName: defaultEnclaveKeyName,

      lastBalance: 0n,
      lastBlockTimestamp: 0,
      lastNonce: 0n,

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

  return { enclaveKeyName, pubKeyHex, hwSecLevel };
}

/**
 * Fetches public key from enclave, or from cache for speed.
 *
 * Fetching from the enclave takes ~1 second on iPhone 13 Mini & iOS simulator.
 */
export async function loadEnclaveKey(enclaveKeyName: string) {
  return await Log.promise(
    "ExpoEnclave.fetchPublicKey",
    ExpoEnclave.fetchPublicKey(enclaveKeyName)
  );
}

/** Deletes a key from the enclave. */
export async function deleteEnclaveKey(enclaveKeyName: string) {
  await Log.promise(
    "ExpoEnclave.deleteKeyPair",
    ExpoEnclave.deleteKeyPair(enclaveKeyName)
  );
}

/** Gets detailed enclave security level */
export async function getEnclaveSec() {
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
