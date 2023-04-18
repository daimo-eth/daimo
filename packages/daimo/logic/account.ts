import { MMKV, useMMKVString } from "react-native-mmkv";
import { assert } from "./assert";
import { useCallback } from "react";

export type Account = AccountV1;

const latestStorageVersion = 1;

interface StoredModel {
  storageVersion: number;
}

interface AccountV1 extends StoredModel {
  storageVersion: 1;
  address: string;
  /** TODO: json-bignum */
  lastBalance: number;
  lastNonce: number;
  lastBlockTimestamp: number;
}

const storage = new MMKV();

export function useAccount(): [Account, (account: Account) => void] {
  const [accountJSON, setAccountJSON] = useMMKVString("account");
  const account = parseAccount(accountJSON);
  const setAccount = useCallback(
    (account: Account) => {
      setAccountJSON(JSON.stringify(account));
    },
    [setAccountJSON]
  );
  return [account, setAccount];
}

function parseAccount(accountJSON?: string): Account | null {
  if (!accountJSON) return null;

  console.log(`Parsing account: ${accountJSON}`);
  const model = JSON.parse(accountJSON) as StoredModel;

  assert(model.storageVersion === latestStorageVersion);
  return model as Account;
}
