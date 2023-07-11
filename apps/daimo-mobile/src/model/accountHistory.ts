import { NamedAccount } from "@daimo/api";
import { useCallback, useEffect, useState } from "react";
import { MMKV } from "react-native-mmkv";
import { Address } from "viem";

import { TransferOpEvent } from "./op";
import { StoredModel } from "./storedModel";
import { assert } from "../logic/assert";
import { cacheName } from "../view/shared/addr";

export interface AccountHistory {
  /** Our own account address */
  address: Address;
  /** The latest finalized block as of the most recent update. */
  lastFinalizedBlock: number;
  /** Transfers to/from other Daimo accounts & other Ethereum accounts. */
  recentTransfers: TransferOpEvent[];
  /** Names for each Daimo account we've interacted with. */
  namedAccounts: { addr: Address; name: string }[];
}

const mmkv = new MMKV();
const historyCache = new Map<Address, AccountHistory>();
const historyListeners = new Map<Address, ((h: AccountHistory) => void)[]>();

export function useAccountHistory(address: Address | undefined) {
  const cachedHist = address ? historyCache.get(address) : undefined;
  const [hist, setHist] = useState<AccountHistory | undefined>(cachedHist);

  // Get latest account history
  // TODO: pass in a chain tip to this function
  const setAll = useCallback(
    address
      ? (h: AccountHistory) => {
          mmkv.set(`history-${address}`, serialize(h));
          historyCache.set(address, h);

          h.namedAccounts.forEach(({ addr, name }) => cacheName(addr, name));

          const listeners = historyListeners.get(address) || [];
          console.log(`[HIST] set ${address}, ${listeners.length} listeners`);
          listeners.forEach((l) => l(h));
        }
      : () => {},
    [address]
  );

  // Once we have an address...
  useEffect(() => {
    if (!address) return;

    // Set up listeners
    const listeners = historyListeners.get(address) ?? [];
    historyListeners.set(address, listeners);
    listeners.push(setHist);

    // Load history from storage, if necessary
    if (hist == null) {
      const json = mmkv.getString(`history-${address}`);
      const history = parse(json) || {
        address,
        lastFinalizedBlock: 0,
        recentTransfers: [],
        namedAccounts: [],
      };
      setAll(history);
    }

    return () => {
      listeners.splice(listeners.indexOf(setHist), 1);
    };
  }, [address]);

  return [hist, setAll] as const;
}

interface AccountHistoryV1 extends StoredModel {
  storageVersion: 1;

  address: Address;
  lastFinalizedBlock: number;
  recentTransfers: TransferOpEvent[];
  namedAccounts: NamedAccount[];
}

function parse(json?: string): AccountHistory | null {
  if (!json) return null;

  const model = JSON.parse(json) as StoredModel;

  // TODO: remove this line once AccountHistory is stable
  // Till then, we wipe storage on every app load.
  if (model.storageVersion < 2) return null;

  assert(model.storageVersion === 1, "Unsupported version");

  const stored = JSON.parse(json) as AccountHistoryV1;

  return stored;
}

function serialize(history: AccountHistory) {
  const stored: AccountHistoryV1 = {
    storageVersion: 1,
    address: history.address,
    lastFinalizedBlock: history.lastFinalizedBlock,
    recentTransfers: history.recentTransfers,
    namedAccounts: history.namedAccounts,
  };

  return JSON.stringify(stored);
}
