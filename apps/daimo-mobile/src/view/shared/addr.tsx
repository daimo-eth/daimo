import { EAccount, getAccountName } from "@daimo/common";
import { Text } from "react-native";
import { Address } from "viem";

import { TextBold } from "./text";

const nameCache = new Map<Address, EAccount>();

export function cacheEAccounts(accounts: EAccount[]) {
  for (const account of accounts) {
    nameCache.set(account.addr, account);
  }
}

export function getCachedEAccount(addr: Address): EAccount {
  return nameCache.get(addr) || { addr };
}

/** Shows a named Daimo account or an Ethereum address. */
export function AddrText({ addr }: { addr: Address }) {
  const acc = getCachedEAccount(addr);

  if (acc.label) return <Text>{acc.label}</Text>;
  if (acc.name || acc.ensName) {
    return <TextBold>{getAccountName(acc)}</TextBold>;
  }
  return <Text>{getAccountName({ addr })}</Text>;
}
