import { Address } from "viem";

import { landlineTrpc } from "./trpc";

export interface LandlineAccount {
  daimoAddress: Address;
  bankName: string;
  accountName: string;
  lastFour: string;
  liquidationAddress: Address;
  chain: string;
  destinationCurrency: string;
  createdAt: Date;
}

export async function getLandlineSession(
  daimoAddress: Address
): Promise<string> {
  const sessionKey = await landlineTrpc.getOrCreateSessionKey.mutate({
    daimoAddress,
  });
  return sessionKey;
}

export async function getLandlineAccounts(
  daimoAddress: Address
): Promise<LandlineAccount[]> {
  const landlineAccounts =
    await landlineTrpc.getExternalAccountsTransferInfo.mutate({
      daimoAddress,
    });
  return landlineAccounts;
}
