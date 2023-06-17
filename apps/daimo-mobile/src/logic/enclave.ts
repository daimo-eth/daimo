import * as ExpoEnclave from "@daimo/expo-enclave";
import { useEffect, useState } from "react";
import { Hex } from "viem";

import { assert } from "./assert";
import { Log } from "./log";
import { rpcHook } from "./trpc";
import { Account, defaultEnclaveKeyName } from "../model/account";

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
