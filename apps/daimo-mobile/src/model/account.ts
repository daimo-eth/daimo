import { EAccount, assert, TransferOpEvent } from "@daimo/common";
import { tokenMetadata } from "@daimo/contract";
import { useEffect, useState } from "react";
import { MMKV } from "react-native-mmkv";
import { Address, getAddress } from "viem";

import { StoredModel } from "./storedModel";
import { chainConfig } from "../logic/chainConfig";
import { cacheEAccounts } from "../view/shared/addr";

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
  /** Account deployment timestamp */
  createdAt: number;
  /** Primary balance token address */
  homeCoin: Address;
  /** Primary balance chain ID */
  homeChainID: number;

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
  namedAccounts: EAccount[];

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
  namedAccounts: EAccount[];

  pushToken: string | null;
}

interface AccountV4 extends StoredModel {
  storageVersion: 4;

  enclaveKeyName: string;
  name: string;
  address: string;
  createdAt: number;
  homeCoin: string;
  homeChainID: number;

  lastBlock: number;
  lastBlockTimestamp: number;
  lastBalance: string;
  lastFinalizedBlock: number;
  recentTransfers: TransferOpEvent[];
  namedAccounts: EAccount[];

  pushToken: string | null;
}

/** Loads and saves Daimo account data from storage. Notifies listeners. */
export function getAccountManager(): AccountManager {
  if (_accountManager == null) {
    _accountManager = new AccountManager();
  }
  return _accountManager;
}

let _accountManager: AccountManager | null = null;

/** Loads and saves Daimo account data from storage. Notifies listeners. */
class AccountManager {
  currentAccount: Account | null;
  private mmkv = new MMKV();
  private listeners = new Set<(a: Account | null) => void>();

  constructor() {
    // On first load, load+save to ensure latest serialization version.
    this.currentAccount = parseAccount(this.mmkv.getString("account"));
    this.mmkv.set("account", serializeAccount(this.currentAccount));
  }

  addListener(listener: (a: Account | null) => void) {
    this.listeners.add(listener);
  }

  removeListener(listener: (a: Account | null) => void) {
    this.listeners.delete(listener);
  }

  addPendingOp(op: TransferOpEvent) {
    if (!this.currentAccount) return;
    this.currentAccount.recentTransfers.push(op);
    this.setCurrentAccount(this.currentAccount);
  }

  setCurrentAccount = (account: Account | null) => {
    console.log("[ACCOUNT] " + (account ? `save ${account.name}` : "clear"));

    // Cache accounts so that addresses show up with correct display names.
    // Would be cleaner use a listener, but must run first.
    if (account) cacheEAccounts(account.namedAccounts);

    this.currentAccount = account;
    this.mmkv.set("account", serializeAccount(account));
    for (const listener of this.listeners) {
      listener(account);
    }
  };
}

/** Loads Daimo user data from storage, provides callback to write. */
export function useAccount(): [
  Account | null,
  (account: Account | null) => void
] {
  const manager = getAccountManager();

  // State + listeners pattern
  const [accState, setAccState] = useState<Account | null>(
    manager.currentAccount
  );
  useEffect(() => {
    manager.addListener(setAccState);
    return () => manager.removeListener(setAccState);
  }, []);

  return [accState, manager.setCurrentAccount];
}

export function parseAccount(accountJSON?: string): Account | null {
  if (!accountJSON) return null;

  const model = JSON.parse(accountJSON) as StoredModel;

  // Migrations
  // Delete V1 testnet account. Re-onboard, ask for notifications permisison.
  if (model.storageVersion === 1) return null;

  if (model.storageVersion === 2) {
    const a = model as AccountV2;
    console.log(`[ACCOUNT] MIGRATE from v2: ${accountJSON}`);
    return {
      enclaveKeyName: a.enclaveKeyName,
      name: a.name,
      address: getAddress(a.address),
      createdAt: 1690000000 /** Old account, Jul 2023 */,
      homeCoin: tokenMetadata.address,
      homeChainID: chainConfig.l2.id,

      lastBalance: BigInt(a.lastBalance),
      lastBlock: 0,
      lastBlockTimestamp: a.lastBlockTimestamp,
      lastFinalizedBlock: 0,

      recentTransfers: [],
      namedAccounts: [],

      pushToken: a.pushToken,
    };
  }

  if (model.storageVersion === 3) {
    console.log(`[ACCOUNT] MIGRATE from v3: ${accountJSON}`);
    const a = model as AccountV3;
    return {
      enclaveKeyName: a.enclaveKeyName,
      name: a.name,
      address: getAddress(a.address),
      createdAt: 1690000000 /** Old account, Jul 2023 */,
      homeCoin: tokenMetadata.address,
      homeChainID: chainConfig.l2.id,

      lastBalance: BigInt(a.lastBalance),
      lastBlock: a.lastBlock,
      lastBlockTimestamp: a.lastBlockTimestamp,
      lastFinalizedBlock: a.lastFinalizedBlock,

      recentTransfers: a.recentTransfers,
      namedAccounts: a.namedAccounts,

      pushToken: a.pushToken,
    };
  }

  assert(model.storageVersion === 4);
  const a = model as AccountV4;
  return {
    enclaveKeyName: a.enclaveKeyName,
    name: a.name,
    address: getAddress(a.address),
    createdAt: a.createdAt,
    homeCoin: getAddress(a.homeCoin),
    homeChainID: a.homeChainID,

    lastBalance: BigInt(a.lastBalance),
    lastBlock: a.lastBlock,
    lastBlockTimestamp: a.lastBlockTimestamp,
    lastFinalizedBlock: a.lastFinalizedBlock,

    recentTransfers: a.recentTransfers,
    namedAccounts: a.namedAccounts,

    pushToken: a.pushToken,
  };
}

export function serializeAccount(account: Account | null): string {
  if (!account) return "";

  const model: AccountV4 = {
    storageVersion: 4,

    enclaveKeyName: account.enclaveKeyName,
    name: account.name,
    address: account.address,
    createdAt: account.createdAt,
    homeCoin: account.homeCoin,
    homeChainID: account.homeChainID,

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
