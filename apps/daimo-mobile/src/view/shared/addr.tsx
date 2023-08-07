import { NamedAccount, getAccountName } from "@daimo/common";
import { useEffect } from "react";
import { Text } from "react-native";
import { Address } from "viem";

import { TextBold } from "./text";
import { Account, getAccountManager } from "../../model/account";

const nameCache = new Map<Address, NamedAccount>();

export function useEAccountCache() {
  const accountManager = getAccountManager();
  cacheEAccounts(accountManager.currentAccount?.namedAccounts || []);

  useEffect(() => {
    const listener = (a: Account | null) =>
      cacheEAccounts(a?.namedAccounts || []);
    accountManager.addListener(listener);
    return () => accountManager.removeListener(listener);
  }, []);
}

function cacheEAccounts(accounts: NamedAccount[]) {
  for (const account of accounts) {
    nameCache.set(account.addr, account);
  }
}

export function getCachedEAccount(addr: Address): NamedAccount {
  return nameCache.get(addr) || { addr };
}

/** Shows a named Daimo account or an Ethereum address. */
export function AddrText({ addr }: { addr: Address }) {
  const acc = nameCache.get(addr);
  if (acc) {
    if (acc.label) return <Text>{acc.label}</Text>;
    if (acc.name || acc.ensName) {
      return <TextBold>{getAccountName(acc)}</TextBold>;
    }
  }
  return <Text>{getAccountName({ addr })}</Text>;
}
