import { Text } from "react-native";
import { Address } from "viem";

import { TextBold } from "./text";

const specialAddrs: { [_: Address]: string } = {
  "0x2a6d311394184eeb6df8fbbf58626b085374ffe7": "faucet",
};

const nameCache = new Map<Address, string>();

export function cacheName(addr: Address, name: string) {
  nameCache.set(addr.toLowerCase() as Address, name);
}

/** Shows a named Daimo account or an Ethereum address. */
export function AddrText({ addr, name }: { addr: Address; name?: string }) {
  if (!name) {
    name = nameCache.get(addr.toLowerCase() as Address);
  }
  if (name) {
    return <TextBold>{name}</TextBold>;
  }

  const special = specialAddrs[addr];
  return <Text>{special || addr}</Text>;
}
