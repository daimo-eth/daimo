import { NamedAccount, getAccountName } from "@daimo/common";
import { ephemeralNotesAddress } from "@daimo/contract";
import { useEffect } from "react";
import { Text } from "react-native";
import { Address } from "viem";

import { TextBold } from "./text";
import { Account, getAccountManager } from "../../model/account";

// Everything we interact with on chain is an Ethereum address, or `Addr`.
// - Some addrs are Daimo `NamedAccount`s, which have a name.
// - Some addrs are special, like the faucet. These get a (non-bolded) display name.
// - The rest display as 0x... addresses.

const specialAddrs: { [_: Address]: string } = {
  "0x2A6d311394184EeB6Df8FBBF58626B085374Ffe7": "faucet",
  "0x37Ac8550dA1E8d227266966A0b4925dfae648f7f": "note", // Old Notes contract
};
specialAddrs[ephemeralNotesAddress] = "note";

const nameCache = new Map<Address, NamedAccount>();

export function useNameCache() {
  useEffect(() => {
    const accountManager = getAccountManager();
    cacheNames(accountManager.currentAccount?.namedAccounts || []);
    const listener = (a: Account | null) => cacheNames(a?.namedAccounts || []);
    accountManager.addListener(listener);
    return () => accountManager.removeListener(listener);
  }, []);
}

function cacheNames(namedAccounts: NamedAccount[]) {
  for (const account of namedAccounts) {
    nameCache.set(account.addr, account);
  }
}

export function getCachedName(addr: Address): string | undefined {
  return nameCache.get(addr)?.name;
}

/** Shows a named Daimo account or an Ethereum address. */
export function AddrText({ addr }: { addr: Address }) {
  const acc = nameCache.get(addr);
  if (acc) {
    return <TextBold>{getAccountName(acc)}</TextBold>;
  }

  const special = specialAddrs[addr];
  if (special) {
    return <Text>{special}</Text>; // Not bold
  }

  return <Text>{getAccountName({ addr })}</Text>;
}
