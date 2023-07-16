import { ephemeralNotesAddress } from "@daimo/contract";
import { Text } from "react-native";
import { Address } from "viem";

import { TextBold } from "./text";

// Everything we interact with on chain is an Ethereum address, or `Addr`.
// - Some addrs are Daimo `NamedAccount`s, which have a name.
// - Some addrs are special, like the faucet. These get a (non-bolded) display name.
// - The rest display as 0x... addresses.

const specialAddrs: { [_: Address]: string } = {
  "0x2a6d311394184eeb6df8fbbf58626b085374ffe7": "faucet",
};
specialAddrs[ephemeralNotesAddress] = "note";

const nameCache = new Map<Address, string>();

export function cacheName(addr: Address, name: string) {
  nameCache.set(addr, name);
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
