import { EAccount } from "@daimo/common";
import { Address } from "viem";

const eAccountCache = new Map<Address, EAccount>();

export function cacheEAccounts(accounts: EAccount[]) {
  for (const account of accounts) {
    eAccountCache.set(account.addr, account);
  }
}

export function getCachedEAccount(addr: Address): EAccount {
  return eAccountCache.get(addr) || { addr };
}
