import { useCallback } from "react";
import { useMMKVString } from "react-native-mmkv";
import { Address } from "viem";

import { StoredModel, latestStorageVersion } from "./storedModel";
import { assert } from "../logic/assert";

/**
 * Singleton account key.
 * Will be a series if/when we support multiple accounts.
 */
export const defaultEnclaveKeyName = "daimo-7";

/** Account data stored on device. */
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

  /** Local device push token, if permission was granted. */
  // TODO: move to a separate Device model if we ever need multiaccount.
  pushToken: string | null;
};

interface AccountV2 extends StoredModel {
  storageVersion: 2;

  name: string;

  address: string;
  lastBalance: string;
  lastNonce: string;
  lastBlockTimestamp: number;

  enclaveKeyName: string;

  pushToken: string | null;
}

let firstLoad = true;

/** Loads Daimo user data from storage, provides callback to write. */
export function useAccount(): [
  Account | null,
  (account: Account | null) => void
] {
  const [accountJSON, setAccountJSON] = useMMKVString("account");
  const account = parse(accountJSON);
  const setAccount = useCallback(
    async (account: Account | null) => {
      console.log("[ACCOUNT] " + (account ? `save ${account.name}` : "clear"));
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

  const model = JSON.parse(accountJSON) as StoredModel;

  // If we ever need migrations, they can happen here.
  assert(
    model.storageVersion <= latestStorageVersion,
    "Unknown storage version. Did you downgrade to an older version of the app?"
  );

  // Delete V1 testnet account. Re-onboard, ask for notifications permisison.
  if (model.storageVersion === 1) return null;

  assert(model.storageVersion === 2);

  const a = model as AccountV2;

  return {
    name: a.name,

    address: a.address as Address,
    lastBalance: BigInt(a.lastBalance),
    lastNonce: BigInt(a.lastNonce),
    lastBlockTimestamp: a.lastBlockTimestamp,

    enclaveKeyName: a.enclaveKeyName,

    pushToken: a.pushToken,
  };
}

export async function serialize(account: Account): Promise<string> {
  const model: AccountV2 = {
    storageVersion: latestStorageVersion,

    name: account.name,

    address: account.address,
    lastBalance: account.lastBalance.toString(),
    lastNonce: account.lastNonce.toString(),
    lastBlockTimestamp: account.lastBlockTimestamp,

    enclaveKeyName: account.enclaveKeyName,

    pushToken: account.pushToken,
  };
  return JSON.stringify(model);
}
