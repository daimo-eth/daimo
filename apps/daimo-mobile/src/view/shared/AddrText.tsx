import { Text } from "react-native";
import { Address } from "viem";

import { TextBold } from "./text";

const specialAddrs: { [_: Address]: string } = {
  "0x2A6d311394184EeB6Df8FBBF58626B085374Ffe7": "FAUCET",
};

const nameCache = new Map<Address, string>();

export function cacheName(addr: Address, name: string) {
  nameCache.set(addr, name);
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
