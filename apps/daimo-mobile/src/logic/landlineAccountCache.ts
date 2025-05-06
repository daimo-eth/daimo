import { LandlineAccount } from "@daimo/common";

// Maps Landline account uuid to account
const landlineAccountCache = new Map<string, LandlineAccount>();

export function cacheLandlineAccounts(accounts: LandlineAccount[]) {
  for (const account of accounts) {
    landlineAccountCache.set(account.landlineAccountUuid, account);
  }
}

export function getCachedLandlineAccount(
  landlineAccountUuid: string
): LandlineAccount | null {
  return landlineAccountCache.get(landlineAccountUuid) || null;
}
