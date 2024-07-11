import { Address } from "viem";

import { landlineTrpc } from "./trpc";

export interface LandlineAccount {
  daimoAddress: Address;
  landlineAccountId: string;
  bankName: string;
  accountName: string;
  lastFour: string;
  liquidationAddress: Address;
  chain: string;
  destinationCurrency: string;
  bankLogo?: string;
  createdAt: string;
}

export async function getLandlineSession(
  daimoAddress: Address
): Promise<string> {
  // @ts-ignore
  const sessionKey = await landlineTrpc.getOrCreateSessionKey.mutate({
    daimoAddress,
  });
  return sessionKey;
}

export async function getLandlineAccounts(
  daimoAddress: Address
): Promise<LandlineAccount[]> {
  const landlineAccounts =
    // @ts-ignore
    await landlineTrpc.getExternalAccountsTransferInfo.query({
      daimoAddress,
    });
  return landlineAccounts;
}

export async function landlineDeposit(
  daimoAddress: Address,
  landlineAccountId: string,
  amount: string,
  memo: string | undefined
): Promise<void> {
  // @ts-ignore
  await landlineTrpc.deposit.mutate({
    daimoAddress,
    landlineAccountId,
    amount,
    memo,
  });
}
