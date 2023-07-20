import { NamedAccount, assert } from "@daimo/common";
import { useCallback, useEffect, useState } from "react";
import { MMKV } from "react-native-mmkv";
import { Address, getAddress } from "viem";

import { TransferOpEvent } from "./op";
import { StoredModel } from "./storedModel";

/**
 * Singleton account key.
 * Will be a series if/when we support multiple accounts.
 */
export const defaultEnclaveKeyName = "daimo-7";

/** Account data stored on device. */
export type Account = {
  /** Local device signing key */
  enclaveKeyName: string;
  /** Daimo name, registered onchain */
  name: string;
  /** Contract wallet address */
  address: Address;

  /** Latest sync block number */
  lastBlock: number;
  /** Latest sync time */
  lastBlockTimestamp: number;
  /** Balance as of lastBlock */
  lastBalance: bigint;

  /** The latest finalized block as of the most recent sync. */
  lastFinalizedBlock: number;
  /** Transfers to/from other Daimo accounts & other Ethereum accounts. */
  recentTransfers: TransferOpEvent[];
  /** Names for each Daimo account we've interacted with. */
  namedAccounts: { addr: Address; name: string }[];

  /** Local device push token, if permission was granted. */
  pushToken: string | null;
};

interface AccountV2 extends StoredModel {
  storageVersion: 2;

  enclaveKeyName: string;
  name: string;
  address: string;

  lastBalance: string;
  lastNonce: string;
  lastBlockTimestamp: number;

  pushToken: string | null;
}

interface AccountV3 extends StoredModel {
  storageVersion: 3;

  enclaveKeyName: string;
  name: string;
  address: string;

  lastBlock: number;
  lastBlockTimestamp: number;
  lastBalance: string;
  lastFinalizedBlock: number;
  recentTransfers: TransferOpEvent[];
  namedAccounts: NamedAccount[];

  pushToken: string | null;
}

const mmkv = new MMKV();
const cachedAccount = null as Account | null;
const listeners = new Set<(a: Account | null) => void>();
let firstLoad = true;

/** Loads Daimo user data from storage, provides callback to write. */
export function useAccount(): [
  Account | null,
  (account: Account | null) => void
] {
  if (firstLoad) {
    // On first load, load+save to ensure latest serialization version.
    firstLoad = false;
    parse(mmkv.getString("account"));
    mmkv.set("account", serialize(cachedAccount));
  }

  // State + listeners pattern
  const [accState, setAccState] = useState<Account | null>(cachedAccount);
  useEffect(() => {
    listeners.add(setAccState);
    return () => {
      listeners.delete(setAccState);
    };
  }, []);

  // Set account, call setState here and in all other listeners.
  const setAccount = useCallback(async (account: Account | null) => {
    console.log("[ACCOUNT] " + (account ? `save ${account.name}` : "clear"));
    mmkv.set("account", serialize(account));
    for (const listener of listeners) {
      listener(account);
    }
  }, []);

  return [accState, setAccount];
}

export function parse(accountJSON?: string): Account | null {
  if (!accountJSON) return null;

  const model = JSON.parse(accountJSON) as StoredModel;

  // Migrations
  // Delete V1 testnet account. Re-onboard, ask for notifications permisison.
  if (model.storageVersion === 1) return null;

  if (model.storageVersion === 2) {
    const a = model as AccountV2;
    return {
      enclaveKeyName: a.enclaveKeyName,
      name: a.name,
      address: getAddress(a.address),

      lastBalance: BigInt(a.lastBalance),
      lastBlock: 0,
      lastBlockTimestamp: a.lastBlockTimestamp,
      lastFinalizedBlock: 0,

      recentTransfers: [],
      namedAccounts: [],

      pushToken: a.pushToken,
    };
  }

  assert(model.storageVersion === 3);
  const a = model as AccountV3;
  return {
    enclaveKeyName: a.enclaveKeyName,
    name: a.name,
    address: getAddress(a.address),

    lastBalance: BigInt(a.lastBalance),
    lastBlock: a.lastBlock,
    lastBlockTimestamp: a.lastBlockTimestamp,
    lastFinalizedBlock: a.lastFinalizedBlock,

    recentTransfers: a.recentTransfers,
    namedAccounts: a.namedAccounts,

    pushToken: a.pushToken,
  };
}

export function serialize(account: Account | null): string {
  if (!account) return "";

  const model: AccountV3 = {
    storageVersion: 3,

    enclaveKeyName: account.enclaveKeyName,
    name: account.name,
    address: account.address,

    lastBalance: account.lastBalance.toString(),
    lastBlock: account.lastBlock,
    lastBlockTimestamp: account.lastBlockTimestamp,
    lastFinalizedBlock: account.lastFinalizedBlock,

    recentTransfers: account.recentTransfers,
    namedAccounts: account.namedAccounts,

    pushToken: account.pushToken,
  };

  return JSON.stringify(model);
}
