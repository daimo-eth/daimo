import { useCallback, useEffect, useState } from "react";
import { MMKV } from "react-native-mmkv";
import { Address } from "viem";

export interface AccountHistory {
  address: Address;
  lastFinalizedBlock: number;
  recentTransfers: Transfer[];
}

export interface Transfer {
  from: Address;
  to: Address;
  amount: number;
  timestamp: number;

  txHash?: string;
  blockNumber?: number;
  blockHash?: string;
  logIndex?: number;
}

const mmkv = new MMKV();
const historyCache = new Map<Address, AccountHistory>();
const historyListeners = new Map<Address, ((h: AccountHistory) => void)[]>();

export function useAccountHistory(address?: Address) {
  const cachedHist = address ? historyCache.get(address) : undefined;
  const [hist, setHist] = useState<AccountHistory | undefined>(cachedHist);

  // Get latest account history
  // TODO: pass in a chain tip to this function
  const setAll = useCallback(
    address
      ? (h: AccountHistory) => {
          mmkv.set(`history-${address}`, serialize(h));
          historyCache.set(address, h);

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
      const history = json
        ? parse(json)
        : { address, lastFinalizedBlock: 0, recentTransfers: [] };
      setAll(history);
    }

    return () => {
      listeners.splice(listeners.indexOf(setHist), 1);
    };
  }, [address]);

  return [hist, setAll] as const;
}

function parse(json: string) {
  // TODO: use StoredModel
  return JSON.parse(json) as AccountHistory;
}

function serialize(history: AccountHistory) {
  return JSON.stringify(history);
}
