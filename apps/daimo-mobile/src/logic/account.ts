import { Address } from "abitype";
import { useCallback, useMemo } from "react";
import { useMMKVString } from "react-native-mmkv";

import { assert } from "./assert";

export type Account = {
  /** Daimo name, registered onchain */
  name: string;

  /** Contract wallet address */
  address: Address;
  lastBalance: bigint;
  lastNonce: bigint;
  lastBlockTimestamp: number;

  /** Local device signing key */
  enclaveKeyName: string;
};

const latestStorageVersion = 1;

interface StoredModel {
  storageVersion: number;
}

interface AccountV1 extends StoredModel {
  storageVersion: 1;

  name: string;

  address: string;
  lastBalance: string;
  lastNonce: string;
  lastBlockTimestamp: number;

  enclaveKeyName: string;
}

let firstLoad = true;

/** Loads Daimo user data from storage, provides callback to write. */
export function useAccount(): [
  Account | null,
  (account: Account | null) => void
] {
  const [accountJSON, setAccountJSON] = useMMKVString("account");
  const account = useMemo(() => parse(accountJSON), [accountJSON]);
  const setAccount = useCallback(
    async (account: Account | null) => {
      console.log("[ACCOUNT] saving...");
      if (account) setAccountJSON(await serialize(account));
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

  console.log(`[ACCOUNT] parsing, ${accountJSON.length} bytes`);
  const model = JSON.parse(accountJSON) as StoredModel;

  // If we ever need migrations, they can happen here.
  assert(model.storageVersion === 1);
  const a = model as AccountV1;

  return {
    name: a.name,

    address: a.address as Address,
    lastBalance: BigInt(a.lastBalance),
    lastNonce: BigInt(a.lastNonce),
    lastBlockTimestamp: a.lastBlockTimestamp,

    enclaveKeyName: a.enclaveKeyName,
  };
}

export async function serialize(account: Account): Promise<string> {
  const model: AccountV1 = {
    storageVersion: latestStorageVersion,

    name: account.name,

    address: account.address,
    lastBalance: account.lastBalance.toString(),
    lastNonce: account.lastNonce.toString(),
    lastBlockTimestamp: account.lastBlockTimestamp,

    enclaveKeyName: account.enclaveKeyName,
  };
  return JSON.stringify(model);
}
