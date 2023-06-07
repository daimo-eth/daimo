import { Address } from "abitype";
import { useCallback } from "react";
import { useMMKVString } from "react-native-mmkv";

import { assert } from "./assert";

export type Account = {
  name: string;

  address: Address;
  lastBalance: bigint;
  lastNonce: bigint;
  lastBlockTimestamp: number;
};

const latestStorageVersion = 1;

interface StoredModel {
  storageVersion: number;
}

interface AccountV1 extends StoredModel {
  storageVersion: 1;
  address: string;
  lastBalance: string;
  lastNonce: string;
  lastBlockTimestamp: number;

  name: string;
}

let firstLoad = true;

/** Loads Daimo user data from storage, provides callback to write. */
export function useAccount(): [Account, (account: Account | null) => void] {
  const [accountJSON, setAccountJSON] = useMMKVString("account");
  const account = parse(accountJSON);
  const setAccount = useCallback(
    (account: Account | null) => {
      console.log("Saving account...");
      if (account) setAccountJSON(serialize(account));
      else setAccountJSON("");
    },
    [setAccountJSON]
  );

  // On first load, load+save to ensure latest serialization version.
  if (firstLoad) {
    firstLoad = false;
    if (account) setAccount(account);
  }

  return [account, setAccount];
}

export function parse(accountJSON?: string): Account | null {
  if (!accountJSON) return null;

  console.log(`Parsing account: ${accountJSON}`);
  const model = JSON.parse(accountJSON) as StoredModel;

  assert(model.storageVersion === latestStorageVersion);
  const a = model as AccountV1;
  return {
    name: a.name,
    address: a.address as Address,
    lastBalance: BigInt(a.lastBalance),
    lastNonce: BigInt(a.lastNonce),
    lastBlockTimestamp: a.lastBlockTimestamp,
  };
}

export function serialize(account: Account): string {
  const model: AccountV1 = {
    storageVersion: latestStorageVersion,
    name: account.name,
    address: account.address,
    lastBalance: account.lastBalance.toString(),
    lastNonce: account.lastNonce.toString(),
    lastBlockTimestamp: account.lastBlockTimestamp,
  };
  return JSON.stringify(model);
}
