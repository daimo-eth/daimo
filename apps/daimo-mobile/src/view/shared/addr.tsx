import { NamedAccount } from "@daimo/common";
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
};
specialAddrs[ephemeralNotesAddress] = "note";

const nameCache = new Map<Address, string>();

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
  for (const { addr, name } of namedAccounts) {
    nameCache.set(addr, name);
  }
}

/** Gets a bare string name or 0x... address prefix */
export function getNameOrAddr({
  addr,
  name,
}: {
  addr: Address;
  name?: string;
}): string {
  if (name) return name;
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

/** Shows a named Daimo account or an Ethereum address. */
export function AddrText({ addr, name }: { addr: Address; name?: string }) {
  if (!name) {
    name = nameCache.get(addr);
  }
  if (name) {
    return <TextBold>{name}</TextBold>;
  }

  const special = specialAddrs[addr];
  return <Text>{special || addr}</Text>;
}
